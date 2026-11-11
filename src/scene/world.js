import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { smoothstep } from '../time/interpolate.js';
import { sunDirection } from '../time/sun.js';
import { createSkyDome } from './sky-dome.js';
import { createBuildings } from './buildings.js';
import { createStars } from './stars.js';
import { PROJECTS } from '../data/projects.js';
import { buildCameraKeyframes, sampleCamera, REDUCED_MOTION_VIEW } from './camera-path.js';
import { createHalftonePass, updateHalftone } from './halftone.js';
import { isStackedLayout } from '../layout.js';
import { generateCity, CITY_DEFAULTS } from '../city/generate.js';
import { createCity } from './city.js';

const PARALLAX = 0.6;
// Layout empilhado (celular e tablet em pé): a ficha fica embaixo, então a câmera mira o centro
// do prédio, se afasta um pouco e abre o campo de visão para o prédio caber na largura estreita.
const PORTRAIT_PULLBACK = 1.25;
const PORTRAIT_LIFT = 0.14; // abaixa o olhar para o prédio subir no quadro
const fovFor = (stacked) => (stacked ? 55 : 40);

// Área útil da janela, sem a barra de rolagem: é o tamanho real do canvas fixo (inset: 0).
const viewport = () => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
});

const SUN_DISTANCE = 300;
const MIN_LIGHT_ALTITUDE = 4;

/**
 * Renderer, câmera, luzes, terreno, projetos e pós-processamento.
 * update(frame) recebe { hour, sun, sky, mouse, reducedMotion, halftone } e só altera a cena;
 * render() desenha; resize() relê o tamanho da área útil da janela.
 */
export function createWorld(canvas, { isTouch, onContextLost }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    onContextLost?.();
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
  let { width, height } = viewport();
  let stacked = isStackedLayout(width, height);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf2a7a0, 0.022);

  const camera = new THREE.PerspectiveCamera(fovFor(stacked), width / height, 0.5, 2500);
  camera.position.set(0, 140, 260);
  const focus = new THREE.Vector3(25, 0, -10);
  camera.lookAt(focus);

  // Céu
  const skyDome = createSkyDome();
  scene.add(skyDome.mesh);

  // Luzes
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9d4cb, 0.4);
  scene.add(hemi);

  const shadowMapSize = isTouch ? 1024 : 2048;
  const makeShadowLight = (color) => {
    const light = new THREE.DirectionalLight(color, 0);
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    const cam = light.shadow.camera;
    cam.left = -160;
    cam.right = 160;
    cam.top = 160;
    cam.bottom = -160;
    cam.near = 1;
    cam.far = 800;
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.05;
    scene.add(light, light.target);
    return light;
  };
  const sunLight = makeShadowLight(0xffffff);
  const moonLight = makeShadowLight(0x8fa6ff);

  // Terreno
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd9d4cb, roughness: 1 }),
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // Meridiana: linha de latão no eixo norte-sul
  const meridian = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.02, 600),
    new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.8, roughness: 0.35, emissive: 0x3a2a10 }),
  );
  meridian.position.set(0, 0.07, 0); // acima do asfalto da avenida
  meridian.receiveShadow = true;
  scene.add(meridian);

  // Cidade-maquete (as quadras das obras ficam reservadas)
  const cityData = generateCity(CITY_DEFAULTS, PROJECTS.map((p) => ({ id: p.id, x: p.origin[0], z: p.origin[1] })));
  const city = createCity(cityData, { sidewalk: CITY_DEFAULTS.sidewalk });
  scene.add(city.group);

  // Projetos, janelas e estrelas
  const buildings = createBuildings(PROJECTS);
  scene.add(buildings.group);
  const stars = createStars();
  scene.add(stars.points);

  // Pós-processamento
  // Alvo com MSAA: sem isso o composer renderiza sem antialias (samples: 0 por padrão).
  const bufferSize = renderer.getDrawingBufferSize(new THREE.Vector2());
  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(bufferSize.x, bufferSize.y, { type: THREE.HalfFloatType, samples: 4 }),
  );
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  const halftonePass = createHalftonePass(); // depois do OutputPass: trabalha em sRGB
  composer.addPass(halftonePass);

  const lightDir = new THREE.Vector3();
  const ndc = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const moonDir = new THREE.Vector3();
  const cameraKeyframes = buildCameraKeyframes(PROJECTS);

  function placeLight(light, dir) {
    light.target.position.copy(focus);
    light.position.copy(focus).addScaledVector(dir, SUN_DISTANCE);
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    focus,
    cityData,
    setExplode: buildings.setExplode,
    layerAnchors: buildings.layerAnchors,
    notePosition: buildings.notePosition,

    /** Posição e direção (no plano) da câmera, para a planta de situação. */
    cameraState() {
      camera.getWorldDirection(viewDir);
      return { x: camera.position.x, z: camera.position.z, dirX: viewDir.x, dirZ: viewDir.z };
    },

    /** Ponto do mundo → coordenadas normalizadas da câmera atual ([−1, 1], z fora disso = atrás/longe). */
    projectNdc([x, y, z]) {
      ndc.set(x, y, z).project(camera);
      return [ndc.x, ndc.y, ndc.z];
    },

    update({ hour, sun, sky, mouse, reducedMotion, halftone, time = 0 }) {
      city.update({ windowGlow: sky.windowGlow, time });
      updateHalftone(halftonePass, {
        ...halftone,
        width,
        height,
        pixelRatio: renderer.getPixelRatio(),
      });

      // Câmera: trajeto do dia + paralaxe sutil do mouse (fixa com "reduzir movimento")
      const view = reducedMotion ? REDUCED_MOTION_VIEW : sampleCamera(hour, cameraKeyframes);
      const px = reducedMotion ? 0 : mouse.nx * PARALLAX;
      const py = reducedMotion ? 0 : -mouse.ny * PARALLAX;
      camera.position.set(view.position[0] + px, view.position[1] + py, view.position[2]);
      focus.set(view.target[0], view.target[1], view.target[2]);
      if (stacked && view.center) {
        focus.set(view.center[0], view.center[1], view.center[2]);
        camera.position.sub(focus).multiplyScalar(PORTRAIT_PULLBACK).add(focus);
        focus.y -= camera.position.distanceTo(focus) * PORTRAIT_LIFT;
      }
      camera.lookAt(focus);
      camera.updateMatrixWorld(); // anotações projetam com a câmera deste quadro

      // Sol: some suavemente entre −2° e 4° de altitude
      const sunVisible = smoothstep((sun.altitude + 2) / 6);
      const d = sunDirection(Math.max(sun.altitude, MIN_LIGHT_ALTITUDE), sun.azimuth);
      lightDir.set(d.x, d.y, d.z);

      sunLight.color.set(sky.light);
      sunLight.intensity = sky.intensity * 1.5 * sunVisible;
      placeLight(sunLight, lightDir);

      // Lua: do lado oposto ao sol, alta e azulada
      const m = sunDirection(35, sun.azimuth + 180);
      moonLight.intensity = 0.55 * (1 - sunVisible);
      placeLight(moonLight, moonDir.set(m.x, m.y, m.z));

      sunLight.castShadow = sunVisible >= 0.5;
      moonLight.castShadow = sunVisible < 0.5;

      hemi.color.set(sky.zenith);
      hemi.intensity = 0.25 + 0.15 * sky.intensity;

      scene.fog.color.set(sky.horizon);
      scene.fog.density = sky.fogDensity;

      skyDome.mesh.position.copy(camera.position);
      skyDome.update(sky, d, sunVisible);
      stars.points.position.copy(camera.position);
      stars.update(sky.starOpacity);
      buildings.updateNight(sky.windowGlow);
    },

    resize() {
      ({ width, height } = viewport());
      stacked = isStackedLayout(width, height);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = fovFor(stacked);
      camera.updateProjectionMatrix();
    },

    render() {
      // Sem halftone, desenha direto na tela: antialias nativo (MSAA) e sem passes extras.
      // O renderer aplica o mesmo tone mapping e a mesma conversão para sRGB do OutputPass.
      if (halftonePass.enabled) composer.render();
      else renderer.render(scene, camera);
    },
  };
}
