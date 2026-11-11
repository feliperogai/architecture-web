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
  it('soma origin do projeto e ordena por hora', () => {
    const k = buildCameraKeyframes([
      { id: 'x', hour: 10, origin: [100, -50], camera: { position: [1, 2, 3], target: [0, 1, 0] } },
    ]);
    const p = k.find((f) => f.hour === 10);
    assert.deepEqual(p.position, [101, 2, -47]);
    assert.deepEqual(p.target, [100, 1, -50]);
    assert.deepEqual(k.map((f) => f.hour), [...k.map((f) => f.hour)].sort((a, b) => a - b));
  });

  it('inclui os keyframes fixos de amanhecer, manifesto, estúdio, contato e rodapé', () => {
    const hours = buildCameraKeyframes([]).map((f) => f.hour);
    assert.deepEqual(hours, [6, 8, 17.5, 20, 23]);
  });

  it('centro do prédio (para telas em pé): soma origin; nos fixos, centro = alvo', () => {
    const k = buildCameraKeyframes([
      { id: 'x', hour: 10, origin: [100, -50], camera: { position: [1, 2, 3], target: [0, 1, 0], center: [0, 5, 0] } },
    ]);
    assert.deepEqual(k.find((f) => f.hour === 10).center, [100, 5, -50]);
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
