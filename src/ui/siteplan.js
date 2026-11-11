// Planta de situação: mini-mapa da cidade com as obras, a avenida, o norte,
// a escala, a câmera (com cone de visão) e o sol na borda.

const SIZE = 180;
const SCALE = 4; // 1 px = 4 m
const CENTER = [22, 0]; // centro da cidade em metros
const SVG = 'http://www.w3.org/2000/svg';

/** Metros (x, z) → px do SVG. Norte (−Z) para cima. */
export const toPlan = (x, z) => [SIZE / 2 + (x - CENTER[0]) / SCALE, SIZE / 2 + (z - CENTER[1]) / SCALE];

function el(name, attrs, parent) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.append(node);
  return node;
}

export function createSitePlan(figure, city, projects) {
  const svg = el('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'siteplan__svg' }, figure);
  el('rect', { x: 0.5, y: 0.5, width: SIZE - 1, height: SIZE - 1, class: 'siteplan__paper' }, svg);

  // Quadras (as das obras, mais escuras)
  for (const b of city.blocks) {
    const [x1, y1] = toPlan(b.minX, b.minZ);
    const [x2, y2] = toPlan(b.maxX, b.maxZ);
    el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, class: b.reserved ? 'siteplan__lot' : 'siteplan__block' }, svg);
  }

  // Avenida Meridiana (x = 0)
  const [ax, top] = toPlan(0, -300);
  const [, bottom] = toPlan(0, 300);
  el('line', { x1: ax, y1: top, x2: ax, y2: bottom, class: 'siteplan__avenue' }, svg);

  // Obras numeradas
  projects.forEach((p, i) => {
    const [x, y] = toPlan(p.origin[0], p.origin[1]);
    el('rect', { x: x - 3.5, y: y - 3.5, width: 7, height: 7, class: 'siteplan__work' }, svg);
    const label = el('text', { x: x + 6, y: y + 3, class: 'siteplan__num' }, svg);
    label.textContent = String(i + 1);
  });

  // Norte e escala
  const north = el('g', { transform: `translate(${SIZE - 16} 22)`, class: 'siteplan__north' }, svg);
  el('path', { d: 'M0 -12 L5 4 L0 1 L-5 4 Z' }, north);
  el('text', { x: 0, y: 14, 'text-anchor': 'middle' }, north).textContent = 'N';
  const scale = el('g', { transform: `translate(10 ${SIZE - 12})`, class: 'siteplan__scale' }, svg);
  el('line', { x1: 0, y1: 0, x2: 100 / SCALE, y2: 0 }, scale);
  el('line', { x1: 0, y1: -3, x2: 0, y2: 3 }, scale);
  el('line', { x1: 100 / SCALE, y1: -3, x2: 100 / SCALE, y2: 3 }, scale);
  el('text', { x: 100 / SCALE + 5, y: 3 }, scale).textContent = '100 m';

  // Câmera (ponto + cone) e sol na borda
  const camera = el('g', { class: 'siteplan__camera' }, svg);
  el('path', { d: 'M0 0 L-9 -22 L9 -22 Z', class: 'siteplan__cone' }, camera);
  el('circle', { r: 3, class: 'siteplan__eye' }, camera);
  const sun = el('circle', { r: 5, class: 'siteplan__sun' }, svg);

  let last = '';
  return {
    /** camera: { x, z, dirX, dirZ } em metros; sunAzimuth em graus; day: sol acima do horizonte. */
    update({ camera: cam, sunAzimuth, day }) {
      const [cx, cy] = toPlan(cam.x, cam.z);
      const heading = (Math.atan2(cam.dirX, -cam.dirZ) * 180) / Math.PI; // 0° = olhando para o norte
      const az = (sunAzimuth * Math.PI) / 180;
      const sx = SIZE / 2 + (SIZE / 2 - 9) * Math.sin(az);
      const sy = SIZE / 2 - (SIZE / 2 - 9) * Math.cos(az);
      const key = [cx, cy, heading, sx, sy].map((v) => v.toFixed(1)).join() + day;
      if (key === last) return;
      last = key;
      camera.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${heading.toFixed(1)})`);
      sun.setAttribute('cx', sx.toFixed(1));
      sun.setAttribute('cy', sy.toFixed(1));
      sun.classList.toggle('siteplan__sun--night', !day);
    },
  };
}
