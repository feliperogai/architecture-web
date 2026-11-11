import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCursor } from '../../src/ui/cursor.js';

function fakeElement() {
  return {
    style: {},
    classList: { add() {}, toggle() {} },
    removed: false,
    remove() {
      this.removed = true;
    },
  };
}

/** Centro do anel a partir do transform e do tamanho escritos no elemento. */
function ringCenter(el) {
  const [, x, y] = el.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  const size = parseFloat(el.style.width ?? '28');
  return { x: Number(x) + size / 2, y: Number(y) + size / 2 };
}

describe('cursor', () => {
  it('devolve o centro do anel, para a lente usar a mesma posição suavizada', () => {
    const el = fakeElement();
    const cursor = createCursor(el, { isTouch: false });
    cursor.update({ x: 100, y: 100, moved: true }, 1, 1 / 60);
    const pos = cursor.update({ x: 400, y: 300, moved: true }, 1, 1 / 60);
    assert.ok(pos, 'update deveria devolver a posição');
    const ring = ringCenter(el);
    assert.ok(Math.abs(pos.x - ring.x) < 0.01 && Math.abs(pos.y - ring.y) < 0.01);
    assert.ok(pos.x > 100 && pos.x < 400, 'posição suavizada, entre a anterior e o mouse');
  });

  it('antes do primeiro movimento não devolve posição', () => {
    const cursor = createCursor(fakeElement(), { isTouch: false });
    assert.equal(cursor.update({ x: 0, y: 0, moved: false }, 0, 1 / 60), null);
  });

  it('em toque o anel é removido e não há posição', () => {
    const el = fakeElement();
    const cursor = createCursor(el, { isTouch: true });
    assert.equal(el.removed, true);
    assert.equal(cursor.update({ x: 10, y: 10, moved: true }, 1, 1 / 60), null);
  });
});
