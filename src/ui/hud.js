import { formatHour } from '../time/clock.js';

/** Relógio em matriz de pontos + instrumento do sol. Só toca no DOM quando o minuto muda. */
export function createHud(root) {
  const timeEl = root.querySelector('[data-hud-time]');
  const sunEl = root.querySelector('[data-hud-sun]');
  let last = '';

  return {
    update(hour, sun) {
      const label = formatHour(hour);
      if (label === last) return;
      last = label;
      timeEl.textContent = label;
      sunEl.textContent = `SOL ${Math.round(sun.altitude)}° · AZ ${Math.round(sun.azimuth)}°`;
    },
  };
}
