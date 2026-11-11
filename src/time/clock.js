import { clamp, lerp } from './interpolate.js';

/**
 * Converte posições de seções em âncoras de rolagem.
 * y = scrollY em que o topo do elemento cruza o centro da viewport,
 * travado no intervalo rolável [0, maxScroll].
 */
export function computeAnchors(items, viewportHeight, maxScroll) {
  return items
    .map(({ top, hour }) => ({ y: clamp(top - viewportHeight / 2, 0, maxScroll), hour }))
    .sort((a, b) => a.y - b.y || a.hour - b.hour);
}

/**
 * Hora do dia para um scrollY, por interpolação linear entre âncoras.
 * Usa a última âncora com y <= scrollY, então empates ficam com a hora maior
 * e nunca há divisão por zero.
 */
export function hourFromScroll(scrollY, anchors) {
  if (anchors.length === 0) return 6;
  let i = -1;
  for (let k = 0; k < anchors.length; k++) {
    if (anchors[k].y <= scrollY) i = k;
  }
  if (i === -1) return anchors[0].hour;
  const a = anchors[i];
  const b = anchors[i + 1];
  if (!b) return a.hour;
  return lerp(a.hour, b.hour, (scrollY - a.y) / (b.y - a.y));
}

export function formatHour(hour) {
  const total = Math.round(hour * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
