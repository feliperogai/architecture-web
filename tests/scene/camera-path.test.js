import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { sampleCamera, buildCameraKeyframes } from '../../src/scene/camera-path.js';

const keys = [
  { hour: 6, position: [0, 0, 0], target: [0, 0, 0] },
  { hour: 8, position: [10, 20, 30], target: [2, 2, 2] },
];

describe('sampleCamera', () => {
  it('exato no keyframe', () => {
    assert.deepEqual(sampleCamera(8, keys).position, [10, 20, 30]);
  });

  it('meio do trecho com smoothstep', () => {
    assert.deepEqual(sampleCamera(7, keys).position, [5, 10, 15]);
  });

  it('easing: 25% do tempo < 25% do caminho', () => {
    assertClose(sampleCamera(6.5, keys).position[0], 1.5625, 6);
  });

  it('trava nos extremos', () => {
    assert.deepEqual(sampleCamera(2, keys).position, [0, 0, 0]);
    assert.deepEqual(sampleCamera(30, keys).target, [2, 2, 2]);
  });
});

describe('buildCameraKeyframes', () => {
  it('dois keyframes por obra (parada com órbita) em torno do centro', () => {
    const k = buildCameraKeyframes([{ id: 'x', hour: 10, origin: [100, -50],
      camera: { position: [0, 2, 20], target: [0, 1, 0], center: [0, 1, 0], orbit: 16 } }]);
    const a = k.find((f) => f.hour === 9.5), b = k.find((f) => f.hour === 10.5);
    assert.ok(a && b);
    const dist = (f) => Math.hypot(f.position[0] - 100, f.position[2] + 50);
    assertClose(dist(a), 20, 6);
    assertClose(dist(b), 20, 6);
    assert.notDeepEqual(a.position, b.position);
    assert.deepEqual(a.center, [100, 1, -50]);
    assert.deepEqual(k.map((f) => f.hour), [...k.map((f) => f.hour)].sort((m, n) => m - n));
  });

  it('inclui os keyframes fixos de amanhecer, manifesto, estúdio, contato e rodapé', () => {
    const hours = buildCameraKeyframes([]).map((f) => f.hour);
    assert.deepEqual(hours, [6, 8, 17.5, 20, 23]);
  });

  it('centro do prédio (para telas em pé): soma origin; nos fixos, centro = alvo', () => {
    const k = buildCameraKeyframes([
      { id: 'x', hour: 10, origin: [100, -50], camera: { position: [1, 2, 3], target: [0, 1, 0], center: [0, 5, 0] } },
    ]);
    assert.deepEqual(k.find((f) => f.hour === 9.5).center, [100, 5, -50]);
    const fixed = k.find((f) => f.hour === 6);
    assert.deepEqual(fixed.center, fixed.target);
  });
});

describe('sampleCamera com centro', () => {
  it('interpola o centro junto com posição e alvo', () => {
    const withCenter = [
      { hour: 6, position: [0, 0, 0], target: [0, 0, 0], center: [0, 0, 0] },
      { hour: 8, position: [10, 20, 30], target: [2, 2, 2], center: [4, 8, 12] },
    ];
    assert.deepEqual(sampleCamera(7, withCenter).center, [2, 4, 6]);
  });
});
