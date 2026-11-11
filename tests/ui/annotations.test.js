import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { noteOpacity, screenFromNdc } from '../../src/ui/annotations.js';

describe('anotações', () => {
  it('opacidade: cheia na parada, some no voo', () => {
    assert.equal(noteOpacity(10, 10), 1);
    assert.equal(noteOpacity(10.35, 10), 1);
    assertClose(noteOpacity(10.475, 10), 0.5);
    assert.equal(noteOpacity(10.6, 10), 0);
    assert.equal(noteOpacity(9.2, 10), 0);
  });
  it('NDC → tela; atrás da câmera ou fora da tela não aparece', () => {
    assert.deepEqual(screenFromNdc([0, 0, 0.5], 800, 600), { x: 400, y: 300, visible: true });
    assert.deepEqual(screenFromNdc([1, 1, 0.5], 800, 600), { x: 800, y: 0, visible: true });
    assert.equal(screenFromNdc([0, 0, 1.2], 800, 600).visible, false);
    assert.equal(screenFromNdc([2, 0, 0.5], 800, 600).visible, false);
  });
});
