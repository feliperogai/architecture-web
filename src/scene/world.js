import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { smoothstep } from '../time/interpolate.js';
import { sunDirection } from '../time/sun.js';
import { createSkyDome } from './sky-dome.js';
import { createBuildings } from './buildings.js';
import { createWindows } from './windows.js';
import { createStars } from './stars.js';
import { PROJECTS } from '../data/projects.js';
import { buildCameraKeyframes, sampleCamera, REDUCED_MOTION_VIEW } from './camera-path.js';

const PARALLAX = 0.6;

const SUN_DISTANCE = 300;
const MIN_LIGHT_ALTITUDE = 4;

/**
 * Renderer, câmera, luzes, terreno e a linha da meridiana.
 * update(frame) recebe { hour, sun, sky } e só altera a cena; render() desenha.
 */
export function createWorld(canvas, { isTouch }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf2a7a0, 0.022);

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 2500);
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
  meridian.position.set(0, 0.011, 0);
  meridian.receiveShadow = true;
  scene.add(meridian);

  // Projetos, janelas e estrelas
  scene.add(createBuildings(PROJECTS));
  const windows = createWindows(PROJECTS);
  scene.add(windows.group);
  const stars = createStars();
  scene.add(stars.points);

  // Pós-processamento
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());

  const lightDir = new THREE.Vector3();
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

    update({ hour, sun, sky, mouse, reducedMotion }) {
      // Câmera: trajeto do dia + paralaxe sutil do mouse (fixa com "reduzir movimento")
      const view = reducedMotion ? REDUCED_MOTION_VIEW : sampleCamera(hour, cameraKeyframes);
      const px = reducedMotion ? 0 : mouse.nx * PARALLAX;
      const py = reducedMotion ? 0 : -mouse.ny * PARALLAX;
      camera.position.set(view.position[0] + px, view.position[1] + py, view.position[2]);
      focus.set(view.target[0], view.target[1], view.target[2]);
      camera.lookAt(focus);

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
      windows.update(sky.windowGlow);
    },

    resize(width, height) {
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    render() {
      composer.render();
    },
  };
}
