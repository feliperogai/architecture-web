// Cidade-maquete gerada como dados puros (sem Three.js): testável e determinística.
// Unidades em metros. Norte = −Z, leste = +X.

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
