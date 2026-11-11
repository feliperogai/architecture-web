import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_DEFAULTS, streetLines, streetWidth, cityBlocks } from '../../src/city/generate.js';

describe('traçado', () => {
  it('ruas a cada 86 m, incluindo a avenida em x = 0', () => {
    const { xs, zs } = streetLines(CITY_DEFAULTS);
    assert.ok(xs.includes(0) && xs.includes(86) && xs.includes(-258) && xs.includes(344));
    assert.ok(zs.includes(0) && zs.includes(-258) && zs.includes(258));
  });
  it('avenida tem 24 m, demais 14 m', () => {
    assert.equal(streetWidth('x', 0, CITY_DEFAULTS), 24);
    assert.equal(streetWidth('x', 86, CITY_DEFAULTS), 14);
    assert.equal(streetWidth('z', 0, CITY_DEFAULTS), 14);
  });
  it('quadras entre bordas de calçada e quadras reservadas pelas obras', () => {
    const blocks = cityBlocks(CITY_DEFAULTS, [{ id: 'seco', x: 45.5, z: 43 }, { id: 'varanda', x: -45.5, z: 43 }]);
    const seco = blocks.find((b) => b.reserved === 'seco');
    assert.deepEqual([seco.minX, seco.maxX, seco.minZ, seco.maxZ], [15, 76, 10, 76]);
    const varanda = blocks.find((b) => b.reserved === 'varanda');
    assert.deepEqual([varanda.minX, varanda.maxX], [-76, -15]);
    assert.equal(blocks.filter((b) => b.reserved).length, 2);
  });
});
