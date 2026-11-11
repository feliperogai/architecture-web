import { damp, lerp, rateFromFrameFactor } from '../time/interpolate.js';

const FOLLOW_RATE = rateFromFrameFactor(0.2);
const SMALL = 28;
const LENS = 280; // diâmetro = 2 × raio da lente do halftone (140 px)

/**
 * Anel que segue o mouse; vira a borda da lente quando lens → 1. Oculto em toque.
 * update() devolve o centro do anel (px CSS) para a lente usar a mesma posição suavizada,
 * ou null quando não há anel (toque, ou antes do primeiro movimento).
 */
export function createCursor(el, { isTouch }) {
  if (!el || isTouch) {
    el?.remove();
    return { update: () => null };
  }

  let x = 0;
  let y = 0;
  let size = SMALL;
  let started = false;

  return {
    /** mouse = { x, y, moved } em px CSS; lens em [0, 1]; dt em segundos. */
    update(mouse, lens, dt) {
      if (!mouse.moved) return null;
      if (!started) {
        started = true;
        x = mouse.x;
        y = mouse.y;
        el.classList.add('cursor--visible');
      }
      x = damp(x, mouse.x, FOLLOW_RATE, dt);
      y = damp(y, mouse.y, FOLLOW_RATE, dt);
      const nextSize = Math.round(lerp(SMALL, LENS, lens));
      if (nextSize !== size) {
        size = nextSize;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
      }
      el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
      el.classList.toggle('cursor--lens', lens > 0.5);
      return { x, y };
    },
  };
}
