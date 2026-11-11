import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../../src/data/projects.js';
import { buildCameraKeyframes, sampleCamera, explodeFraming } from '../../src/scene/camera-path.js';
import { LAYERS, layerIndex, layerOffset } from '../../src/scene/explode.js';

// Projeção igual à da câmera do three (lookAt + perspectiva), sem paralaxe do mouse.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };

function ndc(point, { position, target }, fov = 40, aspect = 16 / 10) {
  const f = norm(sub(target, position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const p = sub(point, position);
  const depth = dot(p, f);
  const t = Math.tan(((fov / 2) * Math.PI) / 180);
  return [dot(p, r) / (depth * t * aspect), dot(p, u) / (depth * t), depth];
}

const keyframes = buildCameraKeyframes(PROJECTS);
const world = (p, [x, y, z], lift = 0) => [p.origin[0] + x, y + lift, p.origin[1] + z];
const inside = ([x, y, depth]) => depth > 0 && Math.abs(x) <= 0.95 && Math.abs(y) <= 0.95;

describe('enquadramento no desktop (16:10, FOV 40°)', () => {
  for (const p of PROJECTS) {
    it(`${p.id}: todas as notas cabem na tela durante a parada`, () => {
      for (const hour of [p.hour - 0.35, p.hour, p.hour + 0.35]) {
        const view = sampleCamera(hour, keyframes);
        for (const note of p.notes) {
          const q = ndc(world(p, note.anchor), view);
          assert.ok(inside(q), `${p.id}/${note.id} às ${hour}h fora da tela: ${q.map((v) => v.toFixed(2))}`);
        }
      }
    });

    it(`${p.id}: explodida, as notas (que sobem com as camadas) continuam na tela`, () => {
      const view = explodeFraming(sampleCamera(p.hour, keyframes), 1, p.explodeGap, LAYERS.length);
      for (const note of p.notes) {
        const lift = layerOffset(layerIndex(note.layer), 1, p.explodeGap);
        const q = ndc(world(p, note.anchor, lift), view);
        assert.ok(inside(q), `${p.id}/${note.id} explodida fora da tela: ${q.map((v) => v.toFixed(2))}`);
      }
    });
  }

  it('explodeFraming não muda nada com a obra montada', () => {
    const view = { position: [10, 5, 30], target: [0, 3, 0], center: [0, 3, 0] };
    assert.deepEqual(explodeFraming(view, 0, 4, 7), view);
  });
});
