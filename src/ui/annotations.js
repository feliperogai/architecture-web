import { smoothstep } from '../time/interpolate.js';

/** Opacidade das notas: cheia até ±0,35 h da obra, some até ±0,6 h. */
export const noteOpacity = (hour, projectHour) => 1 - smoothstep((Math.abs(hour - projectHour) - 0.35) / 0.25);

/** Coordenadas normalizadas (NDC) → px CSS. Atrás da câmera ou fora da tela: invisível. */
export function screenFromNdc([x, y, z], width, height) {
  return {
    x: ((x + 1) / 2) * width,
    y: ((1 - y) / 2) * height,
    visible: z > -1 && z < 1 && Math.abs(x) <= 1.1 && Math.abs(y) <= 1.1,
  };
}

const SVG = 'http://www.w3.org/2000/svg';
const LABEL_SPACE = 250; // largura reservada para a etiqueta junto à borda da tela
const LABEL_GAP = 58; // distância vertical mínima entre etiquetas do mesmo lado

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
      return { note, dot, label, line, side, dx: side * (84 + (i % 3) * 22), dy: -52 + (i % 4) * 30 };
    });
    items.set(project.id, list);
  }

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
    update({ hour, notePosition, projectNdc, width, height, stacked }) {
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
      const placed = active
        ? items.get(active.id).map((item) => {
          const screen = screenFromNdc(projectNdc(notePosition(active.id, item.note)), width, height);
          // Etiqueta dentro da tela: no máximo LABEL_SPACE px da borda do seu lado
          const lx = item.side > 0 ? Math.min(screen.x + item.dx, width - LABEL_SPACE) : Math.max(screen.x + item.dx, LABEL_SPACE);
          return { item, screen, lx, ly: screen.y + item.dy };
        })
        : [];
      // Sem sobreposição: em cada lado, etiquetas a pelo menos LABEL_GAP px umas das outras
      for (const side of [-1, 1]) {
        const column = placed.filter((p) => p.item.side === side && p.screen.visible).sort((a, b) => a.ly - b.ly);
        for (let i = 1; i < column.length; i++) column[i].ly = Math.max(column[i].ly, column[i - 1].ly + LABEL_GAP);
      }

      // 2) Escritas no DOM
      root.classList.toggle('notes--stacked', stacked);
      for (const [id, list] of items) if (!active || id !== active.id) list.forEach(hide);
      for (const { item, screen, lx, ly } of placed) {
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
        item.label.style.transform = `translate(${lx}px, ${ly}px) translate(${item.side > 0 ? '6px' : 'calc(-100% - 6px)'}, -50%)`;
      }
    },
  };
}
