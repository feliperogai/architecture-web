import { clamp } from '../time/interpolate.js';

/**
 * Manifesto que "acende" palavra por palavra conforme a seção atravessa a tela.
 * progress = 0 quando o topo do bloco entra pela base da tela,
 * progress = 1 quando o fim do bloco passa do centro.
 */
export function createReveal(el) {
  const words = [];

  const wrap = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        wrap(child);
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const fragment = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(part);
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          fragment.append(span);
          words.push(span);
        }
      }
      child.replaceWith(fragment);
    }
  };
  wrap(el);

  let last = -1;

  return {
    update() {
      const rect = el.getBoundingClientRect();
      const start = innerHeight; // rect.top quando o bloco entra pela base
      const end = innerHeight / 2 - rect.height; // rect.top quando o fim cruza o centro
      const progress = clamp((start - rect.top) / (start - end), 0, 1);
      if (Math.abs(progress - last) < 0.001) return;
      last = progress;
      const n = words.length;
      words.forEach((word, i) => {
        word.style.opacity = (0.15 + 0.85 * clamp(progress * n - i, 0, 1)).toFixed(3);
      });
    },
  };
}
