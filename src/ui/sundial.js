import { clamp } from '../time/interpolate.js';
import { formatHour } from '../time/clock.js';

const SVG = 'http://www.w3.org/2000/svg';
const C = 200; // centro do viewBox 400 × 400
const RING_TEXT = 'ARQUITETURA · LUZ · TEMPO · MATÉRIA · SOMBRA · ';

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

/** Ponto no mostrador: ângulo 0° = para cima, positivo no sentido horário. */
function polar(radius, deg) {
  const rad = (deg * Math.PI) / 180;
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)];
}

/** Ângulo do gnômon para uma hora: −90° às 06:00, 0° ao meio-dia, +90° às 18:00. */
function hourAngle(hour) {
  return -90 + ((clamp(hour, 6, 18) - 6) / 12) * 180;
}

/**
 * Relógio de sol tipográfico: anel de texto que gira com a rolagem,
 * mostrador de 6 a 18 h e uma sombra em cunha que aponta a hora atual.
 */
export function createSundial(figure) {
  const svg = el('svg', { viewBox: '0 0 400 400', class: 'sundial__svg', role: 'presentation' }, figure);

  // Anel de texto
  const defs = el('defs', {}, svg);
  el('path', {
    id: 'sundial-ring',
    d: `M ${C} ${C} m 0 -180 a 180 180 0 1 1 0 360 a 180 180 0 1 1 0 -360`,
  }, defs);
  const ring = el('g', { class: 'sundial__ring' }, svg);
  const text = el('text', { class: 'sundial__ring-text' }, ring);
  const textPath = el('textPath', {
    href: '#sundial-ring',
    textLength: String(2 * Math.PI * 180 - 6),
    lengthAdjust: 'spacing',
  }, text);
  textPath.textContent = RING_TEXT.repeat(2);

  // Mostrador
  el('circle', { cx: C, cy: C, r: 150, class: 'sundial__dial' }, svg);
  el('line', { x1: C - 150, y1: C, x2: C + 150, y2: C, class: 'sundial__horizon' }, svg);
  for (let h = 6; h <= 18; h++) {
    const angle = hourAngle(h);
    const major = h % 3 === 0;
    const [x1, y1] = polar(150, angle);
    const [x2, y2] = polar(major ? 132 : 140, angle);
    el('line', { x1, y1, x2, y2, class: major ? 'sundial__tick sundial__tick--major' : 'sundial__tick' }, svg);
    if (major) {
      const [tx, ty] = polar(116, angle);
      const label = el('text', { x: tx, y: ty, class: 'sundial__label' }, svg);
      label.textContent = String(h).padStart(2, '0');
    }
  }

  // Sombra do gnômon (desenhada apontando para cima e girada)
  const shadow = el('polygon', {
    points: `${C - 7},${C} ${C},${C - 128} ${C + 7},${C}`,
    class: 'sundial__shadow',
  }, svg);
  el('circle', { cx: C, cy: C, r: 6, class: 'sundial__pin' }, svg);

  const time = el('text', { x: C, y: C + 78, class: 'sundial__time' }, svg);

  let lastRing = NaN;
  let lastShadow = NaN;
  let lastTime = '';

  return {
    update(hour, scrollY) {
      const ringDeg = Math.round(scrollY * 0.04 * 10) / 10;
      if (ringDeg !== lastRing) {
        lastRing = ringDeg;
        ring.setAttribute('transform', `rotate(${ringDeg} ${C} ${C})`);
      }
      const shadowDeg = Math.round(hourAngle(hour) * 10) / 10;
      if (shadowDeg !== lastShadow) {
        lastShadow = shadowDeg;
        shadow.setAttribute('transform', `rotate(${shadowDeg} ${C} ${C})`);
      }
      const label = formatHour(hour);
      if (label !== lastTime) {
        lastTime = label;
        time.textContent = label;
      }
    },
  };
}
