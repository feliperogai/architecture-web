import * as THREE from 'three';
import { clamp } from '../time/interpolate.js';

const GRID = 8; // 8 × 8 "pixels" por ladrilho
const TILE_METERS = 4; // cada ladrilho cobre 4 m → pixels de 0,5 m

/** PRNG determinístico (mulberry32): mesmas janelas a cada visita. */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pixelTexture(rand) {
  const canvas = document.createElement('canvas');
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, GRID, GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const r = rand();
      if (r < 0.5) continue;
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

/** Janelas emissivas que acendem em pixels ao anoitecer, cada uma com seu atraso. */
export function createWindows(projects) {
  const group = new THREE.Group();
  const items = [];
  const rand = random(1914);

  for (const project of projects) {
    for (const win of project.windows) {
      const [w, h] = win.size;
      const texture = pixelTexture(rand);
      texture.repeat.set(Math.max(w / TILE_METERS, 0.25), Math.max(h / TILE_METERS, 0.25));
      const material = new THREE.MeshStandardMaterial({
        color: 0x1a1d24,
        roughness: 0.35,
        emissive: 0xffcf7a,
        emissiveMap: texture,
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(project.origin[0] + win.pos[0], win.pos[1], project.origin[1] + win.pos[2]);
      mesh.rotation.y = win.rotY;
      group.add(mesh);
      items.push({ material, delay: rand() * 0.5 });
    }
  }

  let last = -1;
  return {
    group,
    update(windowGlow) {
      if (windowGlow === last) return;
      last = windowGlow;
      for (const { material, delay } of items) {
        material.emissiveIntensity = 1.2 * clamp((windowGlow - delay) / 0.5, 0, 1);
      }
    },
  };
}
