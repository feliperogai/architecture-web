import { formatHour } from '../time/clock.js';
import { smoothstep } from '../time/interpolate.js';

const DURATION = 1200;

/**
 * Abertura: relógio em matriz de pontos contando de 00:00 a 06:00, depois some.
 * Usa setInterval (e não rAF) para terminar mesmo com a aba em segundo plano.
 */
export function playIntro(el, { reduced }) {
  if (!el) return Promise.resolve();
  const timeEl = el.querySelector('[data-intro-time]');

  const finish = () =>
    new Promise((resolve) => {
      el.classList.add('intro--done');
      setTimeout(() => {
        el.remove();
        resolve();
      }, reduced ? 0 : 700);
    });

  if (reduced) return finish();

  return new Promise((resolve) => {
    const start = performance.now();
    const timer = setInterval(() => {
      const t = Math.min((performance.now() - start) / DURATION, 1);
      timeEl.textContent = formatHour(6 * smoothstep(t));
      if (t >= 1) {
        clearInterval(timer);
        finish().then(resolve);
      }
    }, 33);
  });
}
