import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LAYERS, layerOffset, explodeTarget } from '../../src/scene/explode.js';

describe('vista explodida', () => {
  it('7 camadas na ordem da spec', () => {
    assert.deepEqual(LAYERS.map((l) => l.id), ['fundacao', 'estrutura', 'lajes', 'vedacao', 'cobertura', 'interiores', 'paisagismo']);
  });
  it('layerOffset', () => {
    assert.equal(layerOffset(0, 1, 4), 0);
    assert.equal(layerOffset(3, 1, 4), 12);
    assert.equal(layerOffset(3, 0.5, 4), 6);
  });
  it('explodeTarget: só perto da obra e com o botão pressionado', () => {
    assert.equal(explodeTarget(10.2, 10, true), 1);
    assert.equal(explodeTarget(10.2, 10, false), 0);
    assert.equal(explodeTarget(11.5, 10, true), 0); // rolou para longe: fecha
  });
});
