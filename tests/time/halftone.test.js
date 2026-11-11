import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { halftoneTarget } from '../../src/time/halftone.js';

const H = [10, 12, 14, 16];
describe('halftone só nos voos', () => {
  it('liga entre as obras', () => {
    for (const h of [9, 11, 13, 15]) assert.equal(halftoneTarget(h, H), 1);
  });
  it('desliga nas paradas e fora dos projetos', () => {
    for (const h of [8, 8.5, 10, 10.4, 12.5, 16, 16.9, 17.5]) assert.equal(halftoneTarget(h, H), 0);
  });
});
