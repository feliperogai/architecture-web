// Vista explodida: camadas de baixo para cima e regras puras (sem Three.js).

export const LAYERS = [
  { id: 'fundacao', label: 'Fundação' },
  { id: 'estrutura', label: 'Estrutura' },
  { id: 'lajes', label: 'Lajes' },
  { id: 'vedacao', label: 'Vedações' },
  { id: 'cobertura', label: 'Cobertura' },
  { id: 'interiores', label: 'Interiores' },
  { id: 'paisagismo', label: 'Paisagismo' },
];

export const layerIndex = (id) => LAYERS.findIndex((layer) => layer.id === id);

/** Quanto a camada `index` sobe com a explosão em `amount` (0 a 1) e espaçamento `gap` (m). */
export const layerOffset = (index, amount, gap) => index * gap * amount;

/** A obra só explode perto da sua hora (±1 h) e com o botão pressionado; longe dela, fecha. */
export const explodeTarget = (hour, projectHour, pressed) => (pressed && Math.abs(hour - projectHour) <= 1 ? 1 : 0);
