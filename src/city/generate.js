// Cidade-maquete gerada como dados puros (sem Three.js): testável e determinística.
// Unidades em metros. Norte = −Z, leste = +X.

import { mulberry32, range, pick } from './random.js';

export const CITY_DEFAULTS = {
  seed: 1914,
  bounds: { minX: -300, maxX: 344, minZ: -300, maxZ: 300 },
  pitch: 86, // distância entre eixos de ruas
  street: 14,
  avenue: 24, // Avenida Meridiana, em x = 0
  sidewalk: 3,
};

/** Eixos de ruas: múltiplos de `pitch` dentro da área, em ordem crescente. */
export function streetLines({ bounds, pitch }) {
  const lines = (min, max) => {
    const out = [];
    for (let k = Math.ceil(min / pitch); k * pitch <= max; k++) out.push(k * pitch);
    return out;
  };
  return { xs: lines(bounds.minX, bounds.maxX), zs: lines(bounds.minZ, bounds.maxZ) };
}

export function streetWidth(axis, at, { street, avenue }) {
  return axis === 'x' && at === 0 ? avenue : street;
}

/**
 * Quadras: retângulos entre as bordas de calçada de ruas vizinhas.
 * `reserved` = [{ id, x, z }]: a quadra que contém o ponto fica reservada para a obra.
 */
export function cityBlocks(opts, reserved = []) {
  const { xs, zs } = streetLines(opts);
  const edge = (axis, at, side) => at + side * (streetWidth(axis, at, opts) / 2 + opts.sidewalk);
  const blocks = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const block = {
        minX: edge('x', xs[i], 1),
        maxX: edge('x', xs[i + 1], -1),
        minZ: edge('z', zs[j], 1),
        maxZ: edge('z', zs[j + 1], -1),
        reserved: null,
      };
      const owner = reserved.find((r) => r.x > block.minX && r.x < block.maxX && r.z > block.minZ && r.z < block.maxZ);
      if (owner) block.reserved = owner.id;
      blocks.push(block);
    }
  }
  return blocks;
}

const clampNum = (v, min, max) => Math.min(max, Math.max(min, v));

/** Divide um comprimento em n partes de 12 a 20 m (preferindo ~16 m). */
function lotCount(length) {
  return clampNum(Math.round(length / 16), Math.ceil(length / 20), Math.max(1, Math.floor(length / 12)));
}

/** Os 4 lados de uma quadra: ponto inicial, direção ao longo do lado e normal para fora (rua). */
function blockSides(b) {
  return [
    { start: [b.minX, b.minZ], along: [1, 0], out: [0, -1], length: b.maxX - b.minX }, // norte
    { start: [b.minX, b.maxZ], along: [1, 0], out: [0, 1], length: b.maxX - b.minX }, // sul
    { start: [b.minX, b.minZ], along: [0, 1], out: [-1, 0], length: b.maxZ - b.minZ }, // oeste
    { start: [b.maxX, b.minZ], along: [0, 1], out: [1, 0], length: b.maxZ - b.minZ }, // leste
  ];
}

const onSide = (side, s, offset) => ({
  x: side.start[0] + side.along[0] * s + side.out[0] * offset,
  z: side.start[1] + side.along[1] * s + side.out[1] * offset,
});

/**
 * Gera a cidade-maquete inteira a partir da semente.
 * Retorna só dados: { streets, blocks, buildings, rooftops, trees, lamps, people, crosswalks, dashes, lanes, cars }.
 */
export function generateCity(opts = CITY_DEFAULTS, reserved = []) {
  const rand = mulberry32(opts.seed);
  const { bounds, sidewalk } = opts;
  const { xs, zs } = streetLines(opts);

  const streets = [
    ...xs.map((at) => ({ axis: 'x', at, width: streetWidth('x', at, opts), from: bounds.minZ, to: bounds.maxZ })),
    ...zs.map((at) => ({ axis: 'z', at, width: streetWidth('z', at, opts), from: bounds.minX, to: bounds.maxX })),
  ];
  const blocks = cityBlocks(opts, reserved);

  const buildings = [];
  const rooftops = [];
  const trees = [];
  const lamps = [];
  const people = [];

  for (const block of blocks) {
    const sides = blockSides(block);

    // Calçadas: árvores a cada 12 m (p = 0,7), a 10 m ou mais dos cruzamentos; postes a cada 24 m.
    for (const side of sides) {
      for (let s = 10; s <= side.length - 10; s += 12) {
        if (rand() < 0.7) trees.push({ ...onSide(side, s, sidewalk / 2), r: range(rand, 1.8, 2.6) });
      }
      for (let s = 16; s <= side.length - 10; s += 24) lamps.push(onSide(side, s, sidewalk - 0.5));
    }

    if (block.reserved) {
      // Praça da obra: 8 pessoas a até 4 m da borda da quadra.
      for (let i = 0; i < 8; i++) {
        const side = pick(rand, sides);
        const p = onSide(side, range(rand, 4, side.length - 4), -range(rand, 1, 4));
        people.push({ ...p, rotY: range(rand, 0, Math.PI * 2) });
      }
      continue;
    }

    // Lotes e prédios
    const width = block.maxX - block.minX;
    const depth = block.maxZ - block.minZ;
    const nx = lotCount(width);
    const nz = lotCount(depth);
    const lotW = width / nx;
    const lotD = depth / nz;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        if (rand() >= 0.85) continue;
        const x = block.minX + lotW * (i + 0.5);
        const z = block.minZ + lotD * (j + 0.5);
        const w = (lotW - 3) * range(rand, 0.8, 1);
        const d = (lotD - 3) * range(rand, 0.8, 1);
        const raw = 6 + rand() * (6 + 36 * Math.exp(-Math.abs(x) / 120));
        const h = clampNum(3 * Math.round(raw / 3), 6, 48);
        buildings.push({ x, z, w, d, h });

        if (h > 12) {
          if (rand() < 0.5) {
            rooftops.push({ x: x + range(rand, -w / 5, w / 5), y: h + 1.25, z: z + range(rand, -d / 5, d / 5), w: 3, h: 2.5, d: 3 });
          }
          if (rand() < 0.25) {
            rooftops.push({ x: x - w / 6, y: h + 1.5, z: z + d / 6, w: 4, h: 3, d: 4 });
          }
        }
      }
    }
  }

  // Pessoas nas calçadas
  const open = blocks.filter((b) => !b.reserved);
  for (let i = 0; i < 260; i++) {
    const side = pick(rand, blockSides(pick(rand, open)));
    const p = onSide(side, range(rand, 6, side.length - 6), range(rand, 0.6, sidewalk - 0.6));
    people.push({ ...p, rotY: range(rand, 0, Math.PI * 2) });
  }

  // Faixas de pedestre (listras de 0,5 m a cada 1 m) nos 4 lados de cada cruzamento
  const crosswalks = [];
  for (const x of xs) {
    for (const z of zs) {
      const wx = streetWidth('x', x, opts);
      const wz = streetWidth('z', z, opts);
      for (const s of [-1, 1]) {
        const cz = z + s * (wz / 2 + 1.5); // atravessa a rua vertical (x)
        for (let px = x - wx / 2 + 0.75; px <= x + wx / 2 - 0.75; px += 1) crosswalks.push({ x: px, z: cz, w: 0.5, d: 3 });
        const cx = x + s * (wx / 2 + 1.5); // atravessa a rua horizontal (z)
        for (let pz = z - wz / 2 + 0.75; pz <= z + wz / 2 - 0.75; pz += 1) crosswalks.push({ x: cx, z: pz, w: 3, d: 0.5 });
      }
    }
  }

  // Tracejado no eixo das ruas comuns (a avenida tem a linha de latão)
  const dashes = [];
  for (const street of streets) {
    if (street.width === opts.avenue) continue;
    const crossings = street.axis === 'x' ? zs : xs;
    for (let t = street.from + 4; t <= street.to - 4; t += 9) {
      const nearCrossing = crossings.some((c) => Math.abs(c - t) < 12);
      if (nearCrossing) continue;
      dashes.push(street.axis === 'x'
        ? { x: street.at, z: t, w: 0.25, d: 3 }
        : { x: t, z: street.at, w: 3, d: 0.25 });
    }
  }

  // Faixas de rolamento: duas por rua, em sentidos opostos (±2,5 m do eixo; ±6 m na avenida)
  const lanes = [];
  for (const street of streets) {
    const off = street.width === opts.avenue ? 6 : 2.5;
    if (street.axis === 'x') {
      lanes.push({ start: [street.at + off, street.from], end: [street.at + off, street.to] });
      lanes.push({ start: [street.at - off, street.to], end: [street.at - off, street.from] });
    } else {
      lanes.push({ start: [street.from, street.at - off], end: [street.to, street.at - off] });
      lanes.push({ start: [street.to, street.at + off], end: [street.from, street.at + off] });
    }
  }

  const cars = [];
  for (let i = 0; i < 70; i++) {
    const lane = Math.floor(rand() * lanes.length);
    const [sx, sz] = lanes[lane].start;
    const [ex, ez] = lanes[lane].end;
    cars.push({ lane, phase: range(rand, 0, Math.hypot(ex - sx, ez - sz)), speed: range(rand, 6, 11) });
  }

  return { streets, blocks, buildings, rooftops, trees, lamps, people, crosswalks, dashes, lanes, cars };
}

/** Posição do carro no instante t (s): anda pela faixa e dá a volta. rotY aponta o movimento. */
export function carPosition(car, lane, t) {
  const dx = lane.end[0] - lane.start[0];
  const dz = lane.end[1] - lane.start[1];
  const length = Math.hypot(dx, dz);
  const s = (((car.phase + car.speed * t) % length) + length) % length;
  return {
    x: lane.start[0] + (dx / length) * s,
    z: lane.start[1] + (dz / length) * s,
    rotY: Math.atan2(dx, dz),
  };
}
