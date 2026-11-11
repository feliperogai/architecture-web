export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Suavização exponencial independente da taxa de quadros.
 * `rate` em 1/s; use rateFromFrameFactor para converter um "lerp de X por quadro a 60 fps".
 */
export function damp(current, target, rate, dt) {
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

export function rateFromFrameFactor(factor, fps = 60) {
  return -fps * Math.log(1 - factor);
}

export function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(channel) {
  return Math.round(channel).toString(16).padStart(2, '0');
}

export function lerpColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return '#' + ca.map((c, i) => toHex(lerp(c, cb[i], t))).join('');
}

/**
 * Amostra uma lista de keyframes ordenada por `hour`.
 * `mix(a, b, t)` combina os dois keyframes vizinhos com t em [0, 1].
 * Fora do intervalo, trava no primeiro ou no último keyframe.
 */
export function sampleKeyframes(keys, hour, mix) {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (hour <= first.hour) return mix(first, first, 0);
  if (hour >= last.hour) return mix(last, last, 0);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      return mix(a, b, t);
    }
  }
  return mix(last, last, 0);
}
