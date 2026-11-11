import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCity, CITY_DEFAULTS } from '../../src/city/generate.js';

const RESERVED = [
  { id: 'varanda', x: -45.5, z: 43 }, { id: 'seco', x: 45.5, z: 43 },
  { id: 'fresta', x: 45.5, z: -43 }, { id: 'brisa', x: 129, z: -43 },
];
const city = generateCity(CITY_DEFAULTS, RESERVED);
const overlaps = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
const rectOf = ({ x, z, w = 0, d = 0 }) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
const bands = city.streets.map((s) => {
  const half = s.width / 2 + CITY_DEFAULTS.sidewalk;
  return s.axis === 'x'
    ? { minX: s.at - half, maxX: s.at + half, minZ: s.from, maxZ: s.to }
    : { minX: s.from, maxX: s.to, minZ: s.at - half, maxZ: s.at + half };
});
const reservedBlocks = city.blocks.filter((b) => b.reserved);

describe('generateCity', () => {
  it('determinística', () => {
    assert.deepEqual(generateCity(CITY_DEFAULTS, RESERVED), city);
    assert.notDeepEqual(generateCity({ ...CITY_DEFAULTS, seed: 2 }, RESERVED).buildings, city.buildings);
  });
  it('prédios fora de ruas, calçadas e quadras das obras, dentro da área', () => {
    for (const b of city.buildings) {
      const r = rectOf(b);
      assert.ok(!bands.some((s) => overlaps(r, s)), `prédio sobre rua em ${b.x},${b.z}`);
      assert.ok(!reservedBlocks.some((q) => overlaps(r, q)), `prédio em quadra de obra em ${b.x},${b.z}`);
      assert.ok(r.minX >= -300 && r.maxX <= 344 && r.minZ >= -300 && r.maxZ <= 300);
    }
  });
  it('alturas em pavimentos de 3 m entre 6 e 48', () => {
    assert.ok(city.buildings.every((b) => b.h >= 6 && b.h <= 48 && b.h % 3 === 0));
  });
  it('árvores e postes nas calçadas, nunca dentro das quadras das obras', () => {
    for (const t of [...city.trees, ...city.lamps]) {
      assert.ok(!reservedBlocks.some((q) => overlaps(rectOf(t), q)));
    }
  });
  it('quantidades', () => {
    assert.ok(city.buildings.length >= 300 && city.buildings.length <= 900, `prédios: ${city.buildings.length}`);
    assert.ok(city.trees.length > 100 && city.lamps.length > 50 && city.crosswalks.length > 0);
    assert.equal(city.people.length, 260 + 8 * RESERVED.length);
  });
});
