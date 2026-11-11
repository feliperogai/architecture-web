// As quatro obras como listas de peças (os textos ficam no index.html).
// Unidades em metros; posições relativas a `origin` [x, z]. Norte = −Z, leste = +X.
// Peça: { shape: 'box'|'cylinder', size, pos, rotY?, rot?: [x,y,z], material, layer }
//   box: size = [largura, altura, profundidade]; cylinder: size = [raio, altura].
//   material 'window': plano emissivo em pixels (size = [largura, altura]), orientado por rotY.

const deg = (d) => (d * Math.PI) / 180;

const box = (size, pos, material, layer, extra = {}) => ({ shape: 'box', size, pos, material, layer, ...extra });
const cyl = (radius, height, pos, material, layer, extra = {}) => ({ shape: 'cylinder', size: [radius, height], pos, material, layer, ...extra });
const win = (w, h, pos, rotY) => ({ shape: 'box', size: [w, h, 0.02], pos, rotY, material: 'window', layer: 'vedacao' });

/** Gira (x, z) em torno do eixo Y. */
const turn = ([x, y, z], angle) => [x * Math.cos(angle) + z * Math.sin(angle), y, -x * Math.sin(angle) + z * Math.cos(angle)];

/** Árvore estilizada de praça: tronco + copa cilíndrica. */
const tree = (x, z, r = 1.8) => [
  cyl(0.18, 3, [x, 1.5, z], 'wood', 'paisagismo'),
  cyl(r, 2.2, [x, 3.9, z], 'plant', 'paisagismo'),
];

// ───────────────────────── Casa Varanda ─────────────────────────
function varanda() {
  const parts = [
    box([24, 0.3, 10], [-2, 0.15, -1], 'concrete', 'fundacao'),
    // 6 pilotis Ø 50 cm
    ...[-12, 0, 12].flatMap((x) => [-4, 4].map((z) => cyl(0.25, 3.7, [x, 2.15, z], 'concrete', 'estrutura'))),
    // Laje nervurada com balanço e pingadeira
    box([32, 0.6, 12], [0, 4.3, 0], 'concrete', 'lajes'),
    ...[-14, -7, 0, 7, 14].map((x) => box([0.3, 0.3, 11.4], [x, 3.85, 0], 'concrete', 'lajes')),
    box([32.2, 0.15, 0.2], [0, 3.95, 6.05], 'board', 'lajes'),
    box([32.2, 0.15, 0.2], [0, 3.95, -6.05], 'board', 'lajes'),
    // Caixa de vidro com caixilhos a cada 1,2 m
    box([18, 3.4, 8], [-2, 2, -1], 'glass', 'vedacao'),
    ...Array.from({ length: 16 }, (_, i) => -10.6 + i * 1.2).flatMap((x) => [
      box([0.08, 3.4, 0.08], [x, 2, 3.02], 'steel', 'vedacao'),
      box([0.08, 3.4, 0.08], [x, 2, -5.02], 'steel', 'vedacao'),
    ]),
    win(16, 3, [-2, 2, 3.04], 0),
    win(16, 3, [-2, 2, -5.04], Math.PI),
    // Teto-jardim
    box([28, 0.35, 10], [0, 4.78, 0], 'plant', 'cobertura'),
    ...[-10, -2, 6].map((x) => cyl(0.9, 1, [x, 5.45, -2], 'plant', 'cobertura')),
    // Interiores vistos pelo vidro
    box([3, 0.8, 1], [-6, 0.7, 1.4], 'furniture', 'interiores'),
    box([2.2, 0.75, 1], [0, 0.68, -1.5], 'wood', 'interiores'),
    box([4, 2.4, 0.4], [-9, 1.5, -4.4], 'shelf', 'interiores'),
    box([3, 0.9, 1], [5, 0.75, -2.5], 'furniture', 'interiores'),
    // Deque em réguas de cumaru
    ...Array.from({ length: 12 }, (_, i) => box([10, 0.08, 0.9], [12, 0.34, -3.5 + i], 'wood', 'paisagismo')),
    // Piscina de borda infinita 12 × 3 m
    box([13, 0.3, 4], [-2, 0.15, 8.6], 'stone', 'paisagismo'),
    box([12, 0.12, 3], [-2, 0.26, 8.6], 'water', 'paisagismo'),
    // Escada até o teto-jardim
    ...Array.from({ length: 12 }, (_, i) => box([0.4, 0.36, 1.2], [21 - i * 0.4, 0.48 + i * 0.36, -5.4], 'concrete', 'paisagismo')),
    ...tree(-26, -2), ...tree(18, 14, 2.2), ...tree(-24, -14, 1.6),
  ];
  return {
    id: 'varanda',
    hour: 10,
    origin: [-45.5, 43],
    parts,
    notes: [
      { id: 'laje', anchor: [10, 4.6, 6], layer: 'lajes' },
      { id: 'pilotis', anchor: [12, 2, 4], layer: 'estrutura' },
      { id: 'caixilhos', anchor: [-8, 2.6, 3.05], layer: 'vedacao' },
      { id: 'deque', anchor: [12, 0.4, 6], layer: 'paisagismo' },
      { id: 'piscina', anchor: [-2, 0.35, 8.6], layer: 'paisagismo' },
      { id: 'jardim', anchor: [-8, 5, 0], layer: 'cobertura' },
    ],
    camera: { position: [-34, 6, 34], target: [-6, 3, -8], center: [0, 3, 0], orbit: 16 },
    explodeGap: 3.5,
  };
}

// ───────────────────────── Pavilhão Seco ─────────────────────────
function seco() {
  const boardMarks = [-12.4, 12.4].flatMap((z) =>
    Array.from({ length: 8 }, (_, i) => box([26.05, 0.06, 1.25], [0, 0.6 + i * 0.6, z], 'concrete', 'estrutura')));
  const parts = [
    box([28, 0.25, 28], [0, 0.125, 0], 'concrete', 'fundacao'),
    box([24, 0.04, 22], [0, 0.27, 0], 'earth', 'fundacao'), // piso de terra batida
    // Paredes cegas com marca de fôrma de tábua
    box([26, 5, 1.2], [0, 2.5, -12.4], 'board', 'estrutura'),
    box([26, 5, 1.2], [0, 2.5, 12.4], 'board', 'estrutura'),
    ...boardMarks,
    // Cobertura espessa com pátio de 8 × 8 m
    box([26, 1.4, 9], [0, 5.7, -8.5], 'concrete', 'cobertura'),
    box([26, 1.4, 9], [0, 5.7, 8.5], 'concrete', 'cobertura'),
    box([9, 1.4, 8], [-8.5, 5.7, 0], 'concrete', 'cobertura'),
    box([9, 1.4, 8], [8.5, 5.7, 0], 'concrete', 'cobertura'),
    // Luz interna nas paredes (à noite)
    win(20, 3, [0, 2.2, -11.78], 0),
    win(20, 3, [0, 2.2, 11.78], Math.PI),
    // Bancos de madeira ao redor do pátio
    box([3, 0.45, 0.6], [0, 0.5, -5.5], 'wood', 'interiores'),
    box([3, 0.45, 0.6], [0, 0.5, 5.5], 'wood', 'interiores'),
    box([0.6, 0.45, 3], [-5.5, 0.5, 0], 'wood', 'interiores'),
    box([0.6, 0.45, 3], [5.5, 0.5, 0], 'wood', 'interiores'),
    box([5, 0.8, 1.2], [-9, 0.65, -9], 'wood', 'interiores'),
    // Umbuzeiro no pátio
    cyl(0.35, 2.6, [0, 1.6, 0], 'wood', 'paisagismo'),
    cyl(3.4, 1.4, [0, 3.4, 0], 'plant', 'paisagismo'),
    cyl(2.4, 1, [0.8, 4.4, 0.5], 'plant', 'paisagismo'),
    // Cisterna de 16 mil litros
    cyl(1.8, 2.4, [17, 1.2, 0], 'concrete', 'paisagismo'),
    cyl(1.9, 0.15, [17, 2.45, 0], 'board', 'paisagismo'),
    // Mandacarus
    ...[[18, -10], [-18, 9], [-17, -12]].flatMap(([x, z]) => [
      cyl(0.3, 3.2, [x, 1.6, z], 'plant', 'paisagismo'),
      cyl(0.2, 1.2, [x + 0.6, 2.2, z], 'plant', 'paisagismo'),
    ]),
  ];
  return {
    id: 'seco',
    hour: 12,
    origin: [45.5, 43],
    parts,
    notes: [
      { id: 'cobertura', anchor: [-8, 6.4, -8], layer: 'cobertura' },
      { id: 'patio', anchor: [3.8, 6.4, 3.8], layer: 'cobertura' },
      { id: 'paredes', anchor: [6, 3.5, 13.05], layer: 'estrutura' },
      { id: 'umbuzeiro', anchor: [0, 4.4, 0], layer: 'paisagismo' },
      { id: 'cisterna', anchor: [17, 2.5, 0], layer: 'paisagismo' },
      { id: 'piso', anchor: [-6, 0.3, 6], layer: 'fundacao' },
    ],
    camera: { position: [50, 26, 42], target: [6, 3, -8], center: [0, 3, 0], orbit: 16 },
    explodeGap: 3.5,
  };
}

// ───────────────────────── Biblioteca Fresta ─────────────────────────
function fresta() {
  // 6 lâminas de concreto alternadas com 5 frestas de vidro (eixo z): as frestas aparecem a leste e oeste.
  const blade = (18 - 5 * 0.8) / 6;
  const bladeZ = [];
  const slitZ = [];
  let z = -9;
  for (let i = 0; i < 6; i++) {
    bladeZ.push(z + blade / 2);
    z += blade;
    if (i < 5) {
      slitZ.push(z + 0.4);
      z += 0.8;
    }
  }
  const pergolaBeams = Array.from({ length: 9 }, (_, i) => box([10, 0.15, 0.15], [0, 33, -4.8 + i * 1.2], 'steel', 'cobertura'));
  const paving = [
    ...Array.from({ length: 9 }, (_, i) => box([0.12, 0.03, 34], [-16 + i * 4, 0.2, 0], 'concrete', 'paisagismo')),
    ...Array.from({ length: 9 }, (_, i) => box([34, 0.03, 0.12], [0, 0.2, -16 + i * 4], 'concrete', 'paisagismo')),
  ];
  const parts = [
    box([18, 2, 18], [0, 1, 0], 'concrete', 'fundacao'),
    // Rampa acessível de 8% em patamares
    ...[0.5, 1, 1.5, 2].map((h, i) => box([2, h, 2.4], [-21 + i * 2, h / 2, 0], 'concrete', 'fundacao')),
    ...bladeZ.map((bz) => box([18, 26, blade], [0, 15, bz], 'concrete', 'estrutura')),
    box([6, 0.4, 8], [-12, 4.2, 0], 'concrete', 'lajes'), // marquise em balanço
    ...slitZ.flatMap((sz) => [
      box([17.2, 26, 0.8], [0, 15, sz], 'glass', 'vedacao'),
      win(0.8, 26, [-8.62, 15, sz], -Math.PI / 2),
      win(0.8, 26, [8.62, 15, sz], Math.PI / 2),
    ]),
    box([0.2, 3, 4], [-9.05, 3.5, 0], 'glass', 'vedacao'), // porta de entrada
    // Letreiro em relevo (9 letras)
    ...Array.from({ length: 9 }, (_, i) => box([0.12, 0.8, 0.5], [-9.12, 6.2, -2.4 + i * 0.6], 'steel', 'vedacao')),
    // Cobertura e terraço de leitura com pérgola de aço
    box([18, 2, 18], [0, 29, 0], 'concrete', 'cobertura'),
    box([12, 0.1, 12], [0, 30.05, 0], 'wood', 'cobertura'),
    ...[[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([x, zz]) => cyl(0.08, 3, [x, 31.5, zz], 'steel', 'cobertura')),
    ...pergolaBeams,
    // Estantes de 6 níveis atrás das frestas
    ...slitZ.flatMap((sz) => [-7.4, 7.4].flatMap((x) =>
      Array.from({ length: 6 }, (_, k) => box([0.5, 3.4, 0.7], [x, 4 + k * 4, sz], 'shelf', 'interiores')))),
    // Praça com paginação e árvores
    ...paving,
    ...tree(-14, -13), ...tree(14, 13, 2), ...tree(14, -14, 1.6),
  ];
  return {
    id: 'fresta',
    hour: 14,
    origin: [45.5, -43],
    parts,
    notes: [
      { id: 'frestas', anchor: [-8.7, 20, slitZ[2]], layer: 'vedacao' },
      { id: 'laminas', anchor: [-9, 11, bladeZ[0]], layer: 'estrutura' },
      { id: 'estantes', anchor: [-7.4, 16, slitZ[3]], layer: 'interiores' },
      { id: 'marquise', anchor: [-14.5, 4.4, 2], layer: 'lajes' },
      { id: 'terraco', anchor: [0, 33.2, 0], layer: 'cobertura' },
      { id: 'rampa', anchor: [-19, 1.2, 0], layer: 'fundacao' },
    ],
    camera: { position: [-52, 12, 30], target: [-6, 14, -10], center: [0, 15, 0], orbit: 16 },
    explodeGap: 5,
  };
}

// ───────────────────────── Mirante Brisa ─────────────────────────
function brisa() {
  const slabs = [];
  const guards = [];
  const windows = [];
  for (let i = 0; i < 7; i++) {
    const y = 3.2 * (i + 1);
    const a = deg(9 * i);
    slabs.push(box([7, 0.4, 7], [0, y, 0], 'concrete', 'lajes', { rotY: a }));
    for (const [w, d, local] of [[7, 0.05, [0, 0, 3.5]], [7, 0.05, [0, 0, -3.5]], [0.05, 7, [3.5, 0, 0]], [0.05, 7, [-3.5, 0, 0]]]) {
      const [x, , zz] = turn(local, a);
      guards.push(box([w, 1.1, d], [x, y + 0.75, zz], 'glass', 'vedacao', { rotY: a }));
    }
    windows.push(win(1.4, 2.2, [0, y - 1.5, 1.22], 0));
  }
  // Escada helicoidal de corten: 8 degraus por andar, girando ao redor do núcleo
  const stair = Array.from({ length: 56 }, (_, k) => {
    const theta = deg(45 * k);
    const [x, , zz] = turn([0, 0, 1.9], theta);
    return box([1.1, 0.12, 0.45], [x, 0.9 + k * 0.4, zz], 'corten', 'estrutura', { rotY: theta });
  });
  const shrubs = [[5, 3, 0.7], [-4.5, 4, 0.9], [4, -5, 0.6], [-5.5, -3, 0.8], [7, -1, 0.5], [-2, 6.5, 0.6], [1.5, -7, 0.7], [-7, 1, 0.5]]
    .map(([x, zz, r]) => cyl(r, 0.6 + r, [x, 0.3 + (0.6 + r) / 2, zz], 'plant', 'paisagismo'));
  const rocks = [[6.5, 5, 1.2], [-6, -6, 1], [8, -4, 0.8], [-8, 4.5, 1.1], [2, 8, 0.9]]
    .map(([x, zz, s]) => box([s * 1.6, s, s * 1.2], [x, s / 2, zz], 'stone', 'paisagismo', { rotY: x }));
  const parts = [
    cyl(6, 0.8, [0, 0.4, 0], 'stone', 'fundacao'),
    box([3.2, 1, 3.2], [0, 1.3, 0], 'concrete', 'fundacao'),
    box([2.4, 22.8, 2.4], [0, 11.4, 0], 'concrete', 'estrutura'),
    ...stair,
    ...slabs,
    ...guards,
    ...windows,
    box([3.2, 2.4, 3.2], [0, 23.8, 0], 'glass', 'vedacao', { rotY: deg(54) }),
    box([4.2, 0.25, 4.2], [0, 25.15, 0], 'concrete', 'cobertura', { rotY: deg(54) }),
    // Biruta: mastro + manga de vento
    cyl(0.06, 3, [1.2, 26.8, 1.2], 'steel', 'cobertura'),
    cyl(0.25, 1.6, [2.0, 28, 1.2], 'corten', 'cobertura', { rot: [0, 0, Math.PI / 2] }),
    ...shrubs,
    ...rocks,
  ];
  return {
    id: 'brisa',
    hour: 16,
    origin: [129, -43],
    parts,
    notes: [
      { id: 'lajes', anchor: [3.5, 12.8, 0], layer: 'lajes' },
      { id: 'nucleo', anchor: [0, 8, 1.25], layer: 'estrutura' },
      { id: 'escada', anchor: [1.9, 18, 0], layer: 'estrutura' },
      { id: 'guarda', anchor: [-3.5, 19.95, 0], layer: 'vedacao' },
      { id: 'biruta', anchor: [2, 28, 1.2], layer: 'cobertura' },
      { id: 'cerrado', anchor: [5, 1, 3], layer: 'paisagismo' },
    ],
    camera: { position: [24, 5, 34], target: [8, 13, -7], center: [0, 12, 0], orbit: 16 },
    explodeGap: 4,
  };
}

export const PROJECTS = [varanda(), seco(), fresta(), brisa()];
