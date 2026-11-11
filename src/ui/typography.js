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
    return `${(dx * step * i).toFixed(2)}px ${(dy * step * i).toFixed(2)}px 0 rgba(27, 27, 31, ${alpha.toFixed(3)})`;
  }).join(', ');
}

/** Peso de cada letra do título: mais pesada do lado de onde vem o sol. */
export function letterWeight(i, n, { azimuth }, base) {
  const s = n > 1 ? (2 * i) / (n - 1) - 1 : 0;
  return Math.round(clamp(base + 220 * s * Math.sin(azimuth * DEG), 200, 800));
}

/**
 * Aplica a tipografia viva: variáveis CSS no :root (--title-wght, --title-wdth, --title-shadow)
 * e o peso letra a letra do título "Meridiana". Só escreve quando muda o bastante.
 */
export function createTypography(root, heroTitle) {
  let letters = [];
  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    heroTitle.setAttribute('aria-label', text);
    heroTitle.textContent = '';
    letters = [...text].map((char) => {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char;
      heroTitle.append(span);
      return { span, weight: -1 };
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
      letters.forEach((letter, i) => {
        const w = letterWeight(i, letters.length, sun, lastWght);
        if (Math.abs(w - letter.weight) >= 10) {
          letter.weight = w;
          letter.span.style.setProperty('--w', String(w));
        }
      });
    },
  };
}
