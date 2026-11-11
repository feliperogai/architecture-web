import { clamp, smoothstep } from '../time/interpolate.js';

/** Opacidade das notas: cheia até ±0,35 h da obra, some até ±0,6 h. */
export const noteOpacity = (hour, projectHour) => 1 - smoothstep((Math.abs(hour - projectHour) - 0.35) / 0.25);

/** Coordenadas normalizadas (NDC) → px CSS. Atrás da câmera ou fora da tela: invisível. */
export function screenFromNdc([x, y, z], width, height) {
  return {
    x: ((x + 1) / 2) * width,
    y: ((1 - y) / 2) * height,
    visible: z > -1 && z < 1 && Math.abs(x) <= 1 && Math.abs(y) <= 1,
  };
}

/**
 * Posiciona as etiquetas: cada uma do lado oposto à ficha, mas troca de lado se, presa à borda,
 * fosse cobrir o próprio ponto; mantém `gap` px entre etiquetas do mesmo lado e todas entre
 * `top` (abaixo da barra fixa do topo) e a base da tela.
 * entries: [{ x, y, side, dx, dy }] (dx = distância horizontal, sempre positiva) → [{ lx, ly, side }].
 */
export function placeLabels(entries, { width, height, top, space, gap, labelHeight }) {
  const half = labelHeight / 2;
  const out = entries.map((e) => {
    let side = e.side;
    if (side > 0 && e.x + e.dx > width - space && e.x - e.dx >= space) side = -1;
    else if (side < 0 && e.x - e.dx < space && e.x + e.dx <= width - space) side = 1;
    const lx = side > 0 ? Math.min(e.x + e.dx, width - space) : Math.max(e.x - e.dx, space);
    return { lx, ly: e.y + e.dy, side };
  });
  for (const side of [-1, 1]) {
    const column = out.filter((l) => l.side === side).sort((a, b) => a.ly - b.ly);
    if (!column.length) continue;
    column[0].ly = Math.max(column[0].ly, top + half);
    for (let i = 1; i < column.length; i++) column[i].ly = Math.max(column[i].ly, column[i - 1].ly + gap);
    const overflow = column[column.length - 1].ly - (height - half);
    if (overflow > 0) {
      for (const l of column) l.ly -= overflow;
      column[0].ly = Math.max(column[0].ly, top + half);
      for (let i = 1; i < column.length; i++) column[i].ly = Math.max(column[i].ly, column[i - 1].ly + gap);
    }
  }
  return out;
}

const SVG = 'http://www.w3.org/2000/svg';
const LABEL_SPACE = 250; // largura reservada para a etiqueta junto à borda da tela
const LABEL_GAP = 58; // distância vertical mínima entre etiquetas do mesmo lado
const LABEL_HEIGHT = 52;
const TOP_SAFE = 90; // abaixo da barra fixa do topo (logo, navegação e relógio)

/**
 * Sobreposição das anotações (decorativa: o texto real está nas listas das fichas).
 * Desktop: ponto + linha de chamada + etiqueta em letra de arquiteto, do lado oposto à ficha.
 * Layout empilhado: só pinos numerados (a lista aparece na ficha).
 */
export function createAnnotations(root, projects) {
  const lines = document.createElementNS(SVG, 'svg');
  lines.setAttribute('class', 'notes__lines');
  root.append(lines);

  const items = new Map(); // id da obra → [{ note, dot, label, line }]
  const layerLabels = new Map(); // id da camada → elemento (reaproveitado entre obras)
  for (const project of projects) {
    const article = document.querySelector(`[data-project="${project.id}"]`);
    const side = article?.dataset.side === 'left' ? 1 : -1; // ficha à esquerda → etiquetas à direita
    const list = project.notes.map((note, i) => {
      const source = article?.querySelector(`[data-note="${note.id}"]`);
      const dot = document.createElement('span');
      dot.className = 'note__dot';
      dot.textContent = String(i + 1);
      const label = document.createElement('div');
      label.className = 'note';
      label.innerHTML = `<span class="note__num">${String(i + 1).padStart(2, '0')}</span><span class="note__text"></span>`;
      label.querySelector('.note__text').innerHTML = source ? source.innerHTML : note.id;
      const line = document.createElementNS(SVG, 'line');
      line.setAttribute('class', 'note__line');
      lines.append(line);
      root.append(dot, label);
      return { note, dot, label, line, side, dx: 84 + (i % 3) * 22, dy: -52 + (i % 4) * 30 };
    });
    items.set(project.id, list);
  }

  const layerLabelFor = (id, text) => {
    if (!layerLabels.has(id)) {
      const el = document.createElement('div');
      el.className = 'layer-label';
      el.textContent = text;
      root.append(el);
      layerLabels.set(id, el);
    }
    return layerLabels.get(id);
  };

  const hide = (item) => {
    item.dot.style.opacity = '0';
    item.label.style.opacity = '0';
    item.line.style.opacity = '0';
  };

  return {
    /**
     * hour: hora suavizada; notePosition(id, note) → [x,y,z]; projectNdc([x,y,z]) → [x,y,z];
     * width/height: área útil em px; stacked: layout empilhado.
     */
    update({ hour, notePosition, projectNdc, width, height, stacked, layerAnchors, explodeValue }) {
      // 1) Leituras e contas
      let active = null;
      let best = 0;
      for (const project of projects) {
        const o = noteOpacity(hour, project.hour);
        if (o > best) {
          best = o;
          active = project;
        }
      }
      const projected = active
        ? items.get(active.id).map((item) => ({ item, screen: screenFromNdc(projectNdc(notePosition(active.id, item.note)), width, height) }))
        : [];
      const visible = projected.filter((p) => p.screen.visible);
      const spots = placeLabels(
        visible.map(({ item, screen }) => ({ x: screen.x, y: screen.y, side: item.side, dx: item.dx, dy: item.dy })),
        { width, height, top: TOP_SAFE, space: LABEL_SPACE, gap: LABEL_GAP, labelHeight: LABEL_HEIGHT },
      );
      const placed = projected.map((p) => ({ ...p, ...(p.screen.visible ? spots[visible.indexOf(p)] : {}) }));

      // Rótulos das camadas na vista explodida
      const exploded = active ? explodeValue(active.id) : 0;
      const layerOpacity = Math.min(best, clamp((exploded - 0.3) / 0.4, 0, 1));
      const layers = active && layerOpacity > 0.01
        ? layerAnchors(active.id).map((anchor) => {
          // Do lado oposto à ficha, como as notas
          const right = items.get(active.id)[0]?.side > 0;
          return { anchor, right, screen: screenFromNdc(projectNdc(right ? anchor.right : anchor.left), width, height) };
        })
        : [];

      // 2) Escritas no DOM
      const shown = new Set();
      for (const { anchor, screen, right } of layers) {
        const el = layerLabelFor(anchor.id, anchor.label);
        if (!screen.visible) continue;
        shown.add(anchor.id);
        el.style.opacity = layerOpacity.toFixed(3);
        el.classList.toggle('layer-label--right', right);
        el.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(${right ? '0' : '-100%'}, -50%)`;
      }
      for (const [id, el] of layerLabels) if (!shown.has(id)) el.style.opacity = '0';

      root.classList.toggle('notes--stacked', stacked);
      for (const [id, list] of items) if (!active || id !== active.id) list.forEach(hide);
      for (const { item, screen, lx, ly, side } of placed) {
        if (!screen.visible || best <= 0.01) {
          hide(item);
          continue;
        }
        const opacity = best.toFixed(3);
        item.dot.style.opacity = opacity;
        item.dot.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
        if (stacked) {
          item.label.style.opacity = '0';
          item.line.style.opacity = '0';
          continue;
        }
        item.line.setAttribute('x1', screen.x);
        item.line.setAttribute('y1', screen.y);
        item.line.setAttribute('x2', lx);
        item.line.setAttribute('y2', ly);
        item.line.style.opacity = opacity;
        item.label.style.opacity = opacity;
        item.label.style.transform = `translate(${lx}px, ${ly}px) translate(${side > 0 ? '6px' : 'calc(-100% - 6px)'}, -50%)`;
      }
    },
  };
}
