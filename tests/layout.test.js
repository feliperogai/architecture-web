import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isStackedLayout, STACKED_LAYOUT_QUERY } from '../src/layout.js';

describe('layout empilhado (ficha embaixo, câmera no centro do prédio)', () => {
  it('celular em pé', () => assert.equal(isStackedLayout(375, 812), true));
  it('tablet em pé (iPad 768×1024 e 820×1180)', () => {
    assert.equal(isStackedLayout(768, 1024), true);
    assert.equal(isStackedLayout(820, 1180), true);
  });
  it('desktop e tablet deitado não empilham', () => {
    assert.equal(isStackedLayout(1440, 900), false);
    assert.equal(isStackedLayout(1024, 768), false);
  });
  it('janela estreita (≤ 720 px) empilha', () => assert.equal(isStackedLayout(700, 500), true));

  it('o CSS usa exatamente a mesma media query', () => {
    const css = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8');
    assert.ok(css.includes(`@media ${STACKED_LAYOUT_QUERY}`), `main.css deveria ter @media ${STACKED_LAYOUT_QUERY}`);
  });
});
