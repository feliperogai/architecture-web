import { clamp, smoothstep } from '../time/interpolate.js';

const DEG = Math.PI / 180;

/** Eixos da Bricolage Grotesque pelo sol: fina e condensada à noite, pesada ao meio-dia. */
export function titleAxes(altitude) {
  return {
    wght: 250 + 550 * clamp(altitude / 70, 0, 1),
    wdth: 75 + 25 * smoothstep((altitude + 6) / 12),
  };
}

/**
 * Sombra longa dos títulos, na direção oposta ao sol (como a sombra dos prédios).
 * Sol a leste (az 90°) → sombra para a esquerda; sol ao norte (0°) → sombra para baixo.
 * Quanto mais baixo o sol, mais longa. À noite, nenhuma.
 */
export function longShadow({ altitude, azimuth }, layers = 14) {
  if (altitude <= 0) return 'none';
  const dx = -Math.sin(azimuth * DEG);
  const dy = 0.4 + 0.6 * Math.cos(azimuth * DEG);
  const step = clamp(1 / Math.tan(altitude * DEG), 0.5, 4);
  return Array.from({ length: layers }, (_, k) => {
    const i = k + 1;
    const alpha = 0.22 * (1 - k / layers);
    return `${(dx * step * i).toFixed(2)}px ${(dy * step * i).toFixed(2)}px 0 rgba(201, 130, 43, ${(alpha * 2.4).toFixed(3)})`; // ocre
  }).join(', ');
}

/** Peso de cada letra do título: mais pesada do lado de onde vem o sol. */
export function letterWeight(i, n, { azimuth }, base) {
  const s = n > 1 ? (2 * i) / (n - 1) - 1 : 0;
  return Math.round(clamp(base + 220 * s * Math.sin(azimuth * DEG), 200, 800));
}

/** Peso (200–800) → extrusão da Nabla (EDPT 0–200). */
export const depthFromWeight = (weight) => Math.round(((weight - 200) / 600) * 200);

/**
 * Aplica a tipografia viva: variáveis CSS no :root (--title-wght, --title-wdth, --title-shadow)
 * e, no título da abertura (palavras com [data-letters], em Nabla), a extrusão de cada bloco
 * (--edpt) e a ordem em que os blocos caem (--i). Só escreve quando muda o bastante.
 */
export function createTypography(root, heroTitle) {
  const letters = [];
  let order = 0;
  for (const word of heroTitle ? heroTitle.querySelectorAll('[data-letters]') : []) {
    const chars = [...word.textContent.trim()];
    word.textContent = '';
    word.setAttribute('aria-hidden', 'true'); // o <h1> tem aria-label com o nome inteiro
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.setProperty('--i', String(order++));
      word.append(span);
      letters.push({ span, i, n: chars.length, depth: -100 }); // fora da faixa 0–200: o 1º quadro sempre escreve
    });
  }

  let lastWght = -100;
  let lastWdth = -100;
  let lastShadow = '';

  return {
    update(sun) {
      const { wght, wdth } = titleAxes(sun.altitude);
      if (Math.abs(wght - lastWght) >= 10) {
        lastWght = wght;
        root.style.setProperty('--title-wght', wght.toFixed(0));
      }
      if (Math.abs(wdth - lastWdth) >= 1) {
        lastWdth = wdth;
        root.style.setProperty('--title-wdth', wdth.toFixed(1));
      }
      // Sombra arredondada a 0,5° de azimute/altitude para não reescrever a cada quadro
      const shadow = longShadow({ altitude: Math.round(sun.altitude * 2) / 2, azimuth: Math.round(sun.azimuth * 2) / 2 });
      if (shadow !== lastShadow) {
        lastShadow = shadow;
        root.style.setProperty('--title-shadow', shadow);
      }
      // Blocos mais altos do lado do sol; a pilha toda cresce ao meio-dia e baixa à noite
      for (const letter of letters) {
        const depth = depthFromWeight(letterWeight(letter.i, letter.n, sun, lastWght));
        if (Math.abs(depth - letter.depth) >= 4) {
          letter.depth = depth;
          letter.span.style.setProperty('--edpt', String(depth));
        }
      }
    },
  };
}
