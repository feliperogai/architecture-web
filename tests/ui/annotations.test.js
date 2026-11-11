import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { noteOpacity, screenFromNdc, placeLabels } from '../../src/ui/annotations.js';

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
  it('faixa 1,0–1,1 (ponto fora da tela) também some', () => {
    assert.equal(screenFromNdc([1.05, 0, 0.5], 800, 600).visible, false);
    assert.equal(screenFromNdc([0, -1.05, 0.5], 800, 600).visible, false);
  });
});

describe('placeLabels', () => {
  const opts = { width: 1000, height: 700, top: 90, space: 250, gap: 58, labelHeight: 52 };
  it('etiqueta perto da borda direita troca de lado em vez de cobrir o próprio ponto', () => {
    const [l] = placeLabels([{ x: 900, y: 300, side: 1, dx: 84, dy: 0 }], opts);
    assert.equal(l.side, -1);
    assert.ok(l.lx <= 900 - 84);
  });
  it('dentro da tela: abaixo do topo fixo e acima da base', () => {
    const out = placeLabels([
      { x: 400, y: 20, side: 1, dx: 84, dy: -52 },
      { x: 400, y: 690, side: 1, dx: 84, dy: 38 },
    ], opts);
    for (const l of out) assert.ok(l.ly >= 90 + 26 && l.ly <= 700 - 26, `ly fora: ${l.ly}`);
  });
  it('etiquetas do mesmo lado a pelo menos `gap` px', () => {
    const out = placeLabels([0, 1, 2].map(() => ({ x: 400, y: 300, side: 1, dx: 84, dy: 0 })), opts);
    const ys = out.map((l) => l.ly).sort((a, b) => a - b);
    assert.ok(ys[1] - ys[0] >= 58 && ys[2] - ys[1] >= 58);
  });
});
