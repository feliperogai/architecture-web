import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { titleAxes, longShadow, letterWeight, depthFromWeight } from '../../src/ui/typography.js';

describe('tipografia viva', () => {
  it('eixos pelo sol', () => {
    assert.deepEqual(titleAxes(70), { wght: 800, wdth: 100 });
    assert.equal(titleAxes(0).wght, 250);
    assertClose(titleAxes(0).wdth, 87.5);
    assert.deepEqual(titleAxes(-10), { wght: 250, wdth: 75 });
  });
  it('sombra longa oposta ao sol; nenhuma à noite', () => {
    assert.equal(longShadow({ altitude: -5, azimuth: 0 }), 'none');
    const s = longShadow({ altitude: 30, azimuth: 90 }); // sol a leste → sombra para a esquerda
    const layers = s.split('),').length;
    assert.equal(layers, 14);
    assert.ok(parseFloat(s) < 0, 'primeira camada com dx negativo');
  });
  it('letras do lado do sol mais pesadas', () => {
    const sun = { azimuth: 90 };
    assert.ok(letterWeight(8, 9, sun, 500) > letterWeight(0, 9, sun, 500));
    assert.equal(letterWeight(4, 9, sun, 500), 500);
    assert.equal(letterWeight(8, 9, { azimuth: 90 }, 790), 800); // trava no máximo do eixo
  });
  it('peso → extrusão da Nabla (EDPT 0–200)', () => {
    assert.equal(depthFromWeight(200), 0);
    assert.equal(depthFromWeight(500), 100);
    assert.equal(depthFromWeight(800), 200);
  });
});
