// Geometria e enquadramento dos quatro projetos (os textos ficam no index.html).
// Unidades em metros. Posições de volumes, janelas e câmera são relativas a `origin` [x, z].
// Convenção: norte = −Z, leste = +X, para cima = +Y. PlaneGeometry olha para +Z com rotY = 0.

const deg = (d) => (d * Math.PI) / 180;

function varanda() {
  const pilotis = [];
  for (const x of [-12, 0, 12]) {
    for (const z of [-4, 4]) pilotis.push({ size: [0.5, 4, 0.5], pos: [x, 2, z], material: 'concrete' });
  }
  return {
    id: 'varanda',
    hour: 10,
    origin: [-70, 40],
    volumes: [
      { size: [24, 0.3, 10], pos: [-2, 0.15, -1], material: 'concrete' }, // base
      { size: [18, 3.4, 8], pos: [-2, 2, -1], material: 'glass' }, // caixa de vidro
      ...pilotis,
      { size: [32, 0.6, 12], pos: [0, 4.3, 0], material: 'concrete' }, // laje com balanço
      { size: [10, 0.2, 12], pos: [12, 0.2, 2], material: 'wood' }, // deque
    ],
    windows: [
      { size: [16, 3], pos: [-2, 2, 3.02], rotY: 0 },
      { size: [16, 3], pos: [-2, 2, -5.02], rotY: Math.PI },
    ],
    camera: { position: [-34, 6, 34], target: [6, 3, -2] },
  };
}

function seco() {
  return {
    id: 'seco',
    hour: 12,
    origin: [-10, -10],
    volumes: [
      { size: [28, 0.25, 28], pos: [0, 0.125, 0], material: 'concrete' }, // base
      { size: [26, 5, 1.2], pos: [0, 2.5, -12.4], material: 'concrete' }, // parede cega norte
      { size: [26, 5, 1.2], pos: [0, 2.5, 12.4], material: 'concrete' }, // parede cega sul
      // Cobertura espessa com pátio central de 8 × 8 m
      { size: [26, 1.4, 9], pos: [0, 5.7, -8.5], material: 'concrete' },
      { size: [26, 1.4, 9], pos: [0, 5.7, 8.5], material: 'concrete' },
      { size: [9, 1.4, 8], pos: [-8.5, 5.7, 0], material: 'concrete' },
      { size: [9, 1.4, 8], pos: [8.5, 5.7, 0], material: 'concrete' },
      { size: [6, 0.45, 2], pos: [0, 0.45, 0], material: 'wood' }, // banco no pátio
    ],
    windows: [
      { size: [20, 3], pos: [0, 2.2, -11.79], rotY: 0 },
      { size: [20, 3], pos: [0, 2.2, 11.79], rotY: Math.PI },
    ],
    camera: { position: [42, 22, 34], target: [-6, 1, -2] },
  };
}

function fresta() {
  // Bloco de 18 × 30 × 18 m: 6 lâminas de concreto alternadas com 5 frestas de vidro (eixo z),
  // de modo que as frestas aparecem como linhas verticais nas fachadas leste e oeste.
  const blade = (18 - 5 * 0.8) / 6;
  const volumes = [
    { size: [18, 2, 18], pos: [0, 1, 0], material: 'concrete' },
    { size: [18, 2, 18], pos: [0, 29, 0], material: 'concrete' },
  ];
  const windows = [];
  let z = -9;
  for (let i = 0; i < 6; i++) {
    volumes.push({ size: [18, 30, blade], pos: [0, 15, z + blade / 2], material: 'concrete' });
    z += blade;
    if (i < 5) {
      const zc = z + 0.4;
      volumes.push({ size: [17.2, 26, 0.8], pos: [0, 15, zc], material: 'glass' });
      windows.push({ size: [0.8, 26], pos: [-8.62, 15, zc], rotY: -Math.PI / 2 });
      windows.push({ size: [0.8, 26], pos: [8.62, 15, zc], rotY: Math.PI / 2 });
      z += 0.8;
    }
  }
  return {
    id: 'fresta',
    hour: 14,
    origin: [55, -55],
    volumes,
    windows,
    camera: { position: [-52, 12, 30], target: [4, 14, -2] },
  };
}

function brisa() {
  const volumes = [{ size: [2.4, 22.8, 2.4], pos: [0, 11.4, 0], material: 'concrete' }];
  const windows = [];
  for (let i = 0; i < 7; i++) {
    const y = 3.2 * (i + 1);
    volumes.push({ size: [7, 0.4, 7], pos: [0, y, 0], rotY: deg(9 * i), material: 'concrete' });
    windows.push({ size: [1.4, 2.2], pos: [0, y - 1.5, 1.22], rotY: 0 });
  }
  volumes.push({ size: [3.2, 2.4, 3.2], pos: [0, 23.8, 0], rotY: deg(54), material: 'glass' }); // mirante
  return {
    id: 'brisa',
    hour: 16,
    origin: [120, -10],
    volumes,
    windows,
    camera: { position: [26, 8, 36], target: [-6, 12, 0] },
  };
}

export const PROJECTS = [varanda(), seco(), fresta(), brisa()];
