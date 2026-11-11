import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp } from '../time/interpolate.js';
import { mulberry32 } from '../city/random.js';
import { LAYERS, layerIndex, layerOffset } from './explode.js';

// Materiais reais das obras (a cidade em volta é maquete branca).
const MATERIALS = {
  concrete: new THREE.MeshStandardMaterial({ color: 0xcfc8bc, roughness: 0.92 }),
  board: new THREE.MeshStandardMaterial({ color: 0xbdb6aa, roughness: 0.95 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.08, metalness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.7 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x3c3f44, roughness: 0.45, metalness: 0.6 }),
  corten: new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.8, metalness: 0.2 }),
  water: new THREE.MeshStandardMaterial({ color: 0x6f9fb3, roughness: 0.05, metalness: 0.1 }),
  plant: new THREE.MeshStandardMaterial({ color: 0x7d8f5a, roughness: 1, flatShading: true }),
  earth: new THREE.MeshStandardMaterial({ color: 0xb9946a, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.95, flatShading: true }),
  furniture: new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.8 }),
  shelf: new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.8 }),
};

const PIXEL_GRID = 8; // 8 × 8 "pixels" por ladrilho de janela
const TILE_METERS = 4; // cada ladrilho cobre 4 m → pixels de 0,5 m

/** Ladrilho de janelas acesas em pixels (para as janelas das obras). */
function pixelTexture(rand) {
  const canvas = document.createElement('canvas');
  canvas.width = PIXEL_GRID;
  canvas.height = PIXEL_GRID;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, PIXEL_GRID, PIXEL_GRID);
  for (let y = 0; y < PIXEL_GRID; y++) {
    for (let x = 0; x < PIXEL_GRID; x++) {
      if (rand() < 0.5) continue;
      const level = Math.round(150 + 105 * rand());
      ctx.fillStyle = `rgb(${level}, ${level}, ${level})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);

/** Geometria de uma peça já posicionada (relativa à origem da obra). */
function partGeometry(part, rand) {
  let geometry;
  if (part.material === 'window') {
    const [w, h] = part.size;
    geometry = new THREE.PlaneGeometry(w, h);
    const uv = geometry.attributes.uv;
    const offset = [Math.floor(rand() * PIXEL_GRID) / PIXEL_GRID, Math.floor(rand() * PIXEL_GRID) / PIXEL_GRID];
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) * w) / TILE_METERS + offset[0], (uv.getY(i) * h) / TILE_METERS + offset[1]);
    }
  } else if (part.shape === 'cylinder') {
    const [radius, height] = part.size;
    geometry = new THREE.CylinderGeometry(radius, radius, height, radius > 1 ? 24 : 12);
  } else {
    geometry = new THREE.BoxGeometry(...part.size);
  }
  const [rx, ry, rz] = part.rot ?? [0, part.rotY ?? 0, 0];
  tmpQuat.setFromEuler(tmpEuler.set(rx, ry, rz));
  geometry.applyMatrix4(tmpMatrix.compose(tmpPos.set(...part.pos), tmpQuat, ONE));
  return geometry;
}

/**
 * As obras montadas por camada. Peças da mesma camada e do mesmo material viram uma só malha
 * (poucas chamadas de desenho). Cada camada é um grupo que sobe na vista explodida.
 */
export function createBuildings(projects) {
  const group = new THREE.Group();
  const rand = mulberry32(1914);
  const byId = new Map();

  projects.forEach((project, projectIndex) => {
    const root = new THREE.Group();
    root.name = project.id;
    root.position.set(project.origin[0], 0, project.origin[1]);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1d24, roughness: 0.35, emissive: 0xffcf7a, emissiveMap: pixelTexture(rand), emissiveIntensity: 0,
    });

    const layers = LAYERS.map((layer) => {
      const layerGroup = new THREE.Group();
      layerGroup.name = `${project.id}:${layer.id}`;
      root.add(layerGroup);
      return { ...layer, group: layerGroup, box: new THREE.Box3() };
    });

    // Agrupa por camada + material e funde
    const buckets = new Map();
    for (const part of project.parts) {
      const key = `${part.layer}|${part.material}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(partGeometry(part, rand));
    }
    for (const [key, geometries] of buckets) {
      const [layerId, materialId] = key.split('|');
      const layer = layers[layerIndex(layerId)];
      const geometry = mergeGeometries(geometries);
      geometries.forEach((g) => g.dispose());
      const material = materialId === 'window' ? windowMaterial : MATERIALS[materialId];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = materialId !== 'window';
      mesh.receiveShadow = true;
      layer.group.add(mesh);
      geometry.computeBoundingBox();
      layer.box.union(geometry.boundingBox);
    }

    group.add(root);
    byId.set(project.id, { project, root, layers, windowMaterial, amount: 0, delay: projectIndex * 0.12 });
  });

  let lastGlow = -1;

  return {
    group,

    /** Abre (amount = 1) ou fecha (0) a vista explodida de uma obra. */
    setExplode(id, amount) {
      const entry = byId.get(id);
      if (!entry || entry.amount === amount) return;
      entry.amount = amount;
      entry.layers.forEach((layer, i) => {
        layer.group.position.y = layerOffset(i, amount, entry.project.explodeGap);
      });
    },

    updateNight(windowGlow) {
      if (windowGlow === lastGlow) return;
      lastGlow = windowGlow;
      for (const { windowMaterial, delay } of byId.values()) {
        windowMaterial.emissiveIntensity = 1.2 * clamp((windowGlow - delay) / 0.5, 0, 1);
      }
    },

    /** Rótulos das camadas não vazias: à esquerda da obra, na altura (já explodida) de cada camada. */
    layerAnchors(id) {
      const entry = byId.get(id);
      if (!entry) return [];
      const [ox, oz] = entry.project.origin;
      return entry.layers
        .filter((layer) => !layer.box.isEmpty())
        .map((layer) => {
          const centerY = (layer.box.min.y + layer.box.max.y) / 2 + layer.group.position.y;
          return { id: layer.id, label: layer.label, position: [ox + layer.box.min.x - 3, centerY, oz + (layer.box.min.z + layer.box.max.z) / 2] };
        });
    },

    /** Posição de uma nota no mundo, acompanhando a camada na vista explodida. */
    notePosition(id, note) {
      const entry = byId.get(id);
      const [ox, oz] = entry.project.origin;
      const lift = layerOffset(layerIndex(note.layer), entry.amount, entry.project.explodeGap);
      return [ox + note.anchor[0], note.anchor[1] + lift, oz + note.anchor[2]];
    },
  };
}
