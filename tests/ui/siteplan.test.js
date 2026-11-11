import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toPlan } from '../../src/ui/siteplan.js';

describe('planta de situação', () => {
  it('1 px = 4 m, centro da cidade no centro do SVG, norte para cima', () => {
    assert.deepEqual(toPlan(22, 0), [90, 90]);
    assert.deepEqual(toPlan(62, 0), [100, 90]);
    assert.deepEqual(toPlan(22, -40), [90, 80]);
  });
});
