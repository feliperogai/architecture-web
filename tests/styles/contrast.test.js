import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/main.css', import.meta.url), 'utf8');

const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `token --${name} não encontrado`);
  return match[1];
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (color) => {
  const [r, g, b] = color.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Painel claro (papel com alfa) sobre o pior fundo possível da cena: preto. */
const panelOverBlack = () => {
  const alpha = Number(css.match(/\.panel\s*\{[^}]*background:\s*rgba\(243,\s*239,\s*231,\s*([\d.]+)\)/)[1]);
  return rgb(token('paper')).map((c) => c * alpha);
};

const ruleUses = (selector, prop, value) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(block, `regra ${selector} não encontrada`);
  return new RegExp(`${prop}:\\s*${value.replace(/[()]/g, '\\$&')}`).test(block[2]);
};

describe('contraste AA do texto em latão (spec §7)', () => {
  it('--brass-text sobre papel ≥ 4,5:1', () => {
    assert.ok(contrast(rgb(token('brass-text')), rgb(token('paper'))) >= 4.5);
  });

  it('--brass-text sobre o painel claro no pior caso (cena preta atrás) ≥ 4,5:1', () => {
    assert.ok(contrast(rgb(token('brass-text')), panelOverBlack()) >= 4.5);
  });

  it('os textos pequenos em latão usam --brass-text', () => {
    for (const selector of ['.label', '.project__index', '.project__light span', '.process span']) {
      assert.ok(ruleUses(selector, 'color', 'var(--brass-text)'), `${selector} deveria usar var(--brass-text)`);
    }
  });

  it('no painel noturno a etiqueta volta ao latão claro', () => {
    assert.ok(ruleUses('.panel--night .label', 'color', 'var(--brass)'));
  });
});
