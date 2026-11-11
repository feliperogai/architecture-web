import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp } from '../time/interpolate.js';
import { mulberry32 } from '../city/random.js';
import { carPosition } from '../city/generate.js';

// Cidade-maquete: tudo branco/cinza de maquete de dia; à noite acendem janelas, postes e faróis.
const COLORS = {
  building: 0xefebe4,
  street: 0xa9a59e,
  sidewalk: 0xd6d1c8,
  crown: 0xdfe2d4,
  trunk: 0xcfc8bc,
  lamp: 0x8d8a84,
  person: 0xf4f1ea,
  car: 0xe9e6df,
  stripe: 0xf7f5f0,
};

const WINDOW_TEXELS = 32; // 32 × 32 janelas por repetição da textura; cada janela ocupa 3 × 3 m
const WINDOW_PX = 4; // pixels por janela na textura (vidro + moldura)
const WINDOW_METERS = 3;
const SIDEWALK_HEIGHT = 0.15;
const GLOW_BUCKETS = 4; // prédios em 4 malhas, cada uma acende com um atraso

/**
 * Textura de janelas da cidade: 32 × 32 janelas, cada uma num quadro de 4 × 4 px
 * (vidro de 3 × 2 px com moldura escura), 55% acesas. A janela (0, 0) fica sempre apagada:
 * é para onde apontam topo e base dos prédios.
 */
function windowTexture(rand) {
  const size = WINDOW_TEXELS * WINDOW_PX;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < WINDOW_TEXELS; y++) {
    for (let x = 0; x < WINDOW_TEXELS; x++) {
      if ((x === 0 && y === 0) || rand() >= 0.55) continue;
      const level = Math.round(170 + 85 * rand());
      ctx.fillStyle = `rgb(${level}, ${Math.round(level * 0.92)}, ${Math.round(level * 0.75)})`;
      ctx.fillRect(x * WINDOW_PX, y * WINDOW_PX + 1, 3, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // v = 0 é a primeira linha do canvas: a janela (0, 0) é a apagada
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Caixa com UVs em "janelas": nas laterais 1 texel = 3 m; topo e base no texel apagado.
 * Ordem das faces da BoxGeometry: +x, −x, +y, −y, +z, −z (4 vértices cada).
 */
function windowedBox({ x, y, z, w, h, d }, offset, withWindows = true) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.attributes.uv;
  const dark = 0.5 / (WINDOW_TEXELS * WINDOW_PX); // pixel (0, 0): moldura, sempre apagado
  const faceSize = [[d, h], [d, h], null, null, [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    for (let v = face * 4; v < face * 4 + 4; v++) {
      const size = faceSize[face];
      if (!withWindows || !size) {
        uv.setXY(v, dark, dark);
      } else {
        const u = (uv.getX(v) * size[0]) / WINDOW_METERS / WINDOW_TEXELS + offset[0];
        const t = (uv.getY(v) * size[1]) / WINDOW_METERS / WINDOW_TEXELS + offset[1];
        uv.setXY(v, u, t);
      }
    }
  }
  geometry.translate(x, y, z);
  return geometry;
}

const flatBox = ({ x, y, z, w, h, d }) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

function instanced(geometry, material, items, place, { castShadow = false } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(items.length, 1));
  mesh.count = items.length;
  const m = new THREE.Matrix4();
  items.forEach((item, i) => {
    place(item, m);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

/** Monta a cidade-maquete a partir dos dados de generateCity. */
export function createCity(data, { sidewalk = 3 } = {}) {
  const group = new THREE.Group();
  group.name = 'cidade';
  const rand = mulberry32(2026);

  // Ruas e calçadas (uma malha cada)
  const streetGeos = data.streets.map((s) =>
    s.axis === 'x'
      ? flatBox({ x: s.at, y: 0.025, z: (s.from + s.to) / 2, w: s.width, h: 0.05, d: s.to - s.from })
      : flatBox({ x: (s.from + s.to) / 2, y: 0.025, z: s.at, w: s.to - s.from, h: 0.05, d: s.width }));
  const streets = new THREE.Mesh(mergeGeometries(streetGeos), new THREE.MeshStandardMaterial({ color: COLORS.street, roughness: 1 }));
  streets.receiveShadow = true;
  group.add(streets);

  const sidewalkGeos = data.blocks.map((b) => flatBox({
    x: (b.minX + b.maxX) / 2, y: SIDEWALK_HEIGHT / 2, z: (b.minZ + b.maxZ) / 2,
    w: b.maxX - b.minX + 2 * sidewalk, h: SIDEWALK_HEIGHT, d: b.maxZ - b.minZ + 2 * sidewalk,
  }));
  const sidewalks = new THREE.Mesh(mergeGeometries(sidewalkGeos), new THREE.MeshStandardMaterial({ color: COLORS.sidewalk, roughness: 0.95 }));
  sidewalks.receiveShadow = true;
  group.add(sidewalks);

  // Prédios + caixas d'água: fundidos em GLOW_BUCKETS malhas (atrasos diferentes à noite)
  const texture = windowTexture(rand);
  const buckets = Array.from({ length: GLOW_BUCKETS }, () => []);
  for (const b of data.buildings) {
    const offset = [Math.floor(rand() * WINDOW_TEXELS) / WINDOW_TEXELS, Math.floor(rand() * WINDOW_TEXELS) / WINDOW_TEXELS];
    buckets[Math.floor(rand() * GLOW_BUCKETS)].push(windowedBox({ x: b.x, y: b.h / 2, z: b.z, w: b.w, h: b.h, d: b.d }, offset));
  }
  data.rooftops.forEach((r, i) => buckets[i % GLOW_BUCKETS].push(windowedBox(r, [0, 0], false)));
  const buildingMaterials = buckets.map((geos, i) => {
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.building, roughness: 0.9, emissive: 0xffd9a0, emissiveMap: texture, emissiveIntensity: 0,
    });
    const mesh = new THREE.Mesh(mergeGeometries(geos), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return { material, delay: (i / GLOW_BUCKETS) * 0.5 };
  });

  // Árvores de maquete
  const up = SIDEWALK_HEIGHT;
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  group.add(instanced(new THREE.CylinderGeometry(0.15, 0.2, 3, 6), new THREE.MeshStandardMaterial({ color: COLORS.trunk, roughness: 1 }),
    data.trees, (t, m) => m.makeTranslation(t.x, up + 1.5, t.z), { castShadow: true }));
  group.add(instanced(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: COLORS.crown, roughness: 1, flatShading: true }),
    data.trees, (t, m) => m.compose(p.set(t.x, up + 3 + t.r * 0.8, t.z), q.identity(), s.setScalar(t.r)), { castShadow: true }));

  // Postes e luminárias
  group.add(instanced(new THREE.CylinderGeometry(0.08, 0.1, 6, 5), new THREE.MeshStandardMaterial({ color: COLORS.lamp, roughness: 0.6 }),
    data.lamps, (l, m) => m.makeTranslation(l.x, up + 3, l.z)));
  const lampHeadMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lamp, emissive: 0xffcf7a, emissiveIntensity: 0 });
  group.add(instanced(new THREE.BoxGeometry(0.7, 0.18, 0.7), lampHeadMaterial, data.lamps, (l, m) => m.makeTranslation(l.x, up + 6.05, l.z)));

  // Pessoas em escala
  group.add(instanced(new THREE.CylinderGeometry(0.22, 0.22, 1.7, 6), new THREE.MeshStandardMaterial({ color: COLORS.person, roughness: 0.9 }),
    data.people, (h, m) => m.makeTranslation(h.x, up + 0.85, h.z)));

  // Faixas de pedestre e tracejado
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.stripe, roughness: 0.9 });
  const flat = (f, m) => m.compose(p.set(f.x, 0.06, f.z), q.identity(), s.set(f.w, 0.02, f.d));
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), stripeMaterial, data.crosswalks, flat));
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), stripeMaterial, data.dashes, flat));

  // Carros e faróis (posição atualizada a cada quadro)
  const carMesh = instanced(new THREE.BoxGeometry(1.8, 1.3, 4.2), new THREE.MeshStandardMaterial({ color: COLORS.car, roughness: 0.7 }),
    data.cars, () => {}, { castShadow: true });
  const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xfff3c4, emissiveIntensity: 0 });
  const lightsMesh = instanced(new THREE.BoxGeometry(1.5, 0.22, 0.12), headlightMaterial, data.cars, () => {});
  carMesh.frustumCulled = false;
  lightsMesh.frustumCulled = false;
  group.add(carMesh, lightsMesh);

  const carMatrix = new THREE.Matrix4();
  const lightMatrix = new THREE.Matrix4();
  const lightOffset = new THREE.Matrix4().makeTranslation(0, 0.1, 2.12);
  const yAxis = new THREE.Vector3(0, 1, 0);
  let lastGlow = -1;

  return {
    group,
    update({ windowGlow, time }) {
      data.cars.forEach((car, i) => {
        const pos = carPosition(car, data.lanes[car.lane], time);
        carMatrix.compose(p.set(pos.x, 0.05 + 0.65, pos.z), q.setFromAxisAngle(yAxis, pos.rotY), s.set(1, 1, 1));
        carMesh.setMatrixAt(i, carMatrix);
        lightsMesh.setMatrixAt(i, lightMatrix.multiplyMatrices(carMatrix, lightOffset));
      });
      carMesh.instanceMatrix.needsUpdate = true;
      lightsMesh.instanceMatrix.needsUpdate = true;

      if (windowGlow === lastGlow) return;
      lastGlow = windowGlow;
      for (const { material, delay } of buildingMaterials) {
        material.emissiveIntensity = 0.95 * clamp((windowGlow - delay) / 0.5, 0, 1);
      }
      lampHeadMaterial.emissiveIntensity = 0.9 * windowGlow;
      headlightMaterial.emissiveIntensity = 1.4 * windowGlow;
    },
  };
}
