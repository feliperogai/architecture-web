import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, range, pick } from '../../src/city/random.js';

describe('random', () => {
  it('determinístico por semente e em [0,1)', () => {
    const a = mulberry32(7), b = mulberry32(7);
    const xs = Array.from({ length: 50 }, () => a());
    assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
    assert.ok(xs.every((x) => x >= 0 && x < 1));
  });
  it('range e pick', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) { const v = range(r, 6, 11); assert.ok(v >= 6 && v < 11); }
    assert.ok(['a', 'b'].includes(pick(r, ['a', 'b'])));
  });
});
