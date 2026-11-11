import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, smoothstep, lerpColor, sampleKeyframes } from '../../src/time/interpolate.js';

describe('interpolate', () => {
  it('clamp', () => {
    assert.equal(clamp(5, 0, 1), 1);
    assert.equal(clamp(-1, 0, 1), 0);
    assert.equal(clamp(0.3, 0, 1), 0.3);
  });

  it('lerp', () => {
    assert.equal(lerp(10, 20, 0.25), 12.5);
  });

  it('smoothstep', () => {
    assert.equal(smoothstep(-1), 0);
    assert.equal(smoothstep(0.5), 0.5);
    assert.equal(smoothstep(2), 1);
  });

  it('lerpColor', () => {
    assert.equal(lerpColor('#000000', '#ffffff', 0.5), '#808080');
    assert.equal(lerpColor('#ff0000', '#0000ff', 0), '#ff0000');
    assert.equal(lerpColor('#ff0000', '#0000ff', 1), '#0000ff');
  });

  it('sampleKeyframes', () => {
    const keys = [{ hour: 6, v: 0 }, { hour: 8, v: 10 }, { hour: 12, v: 30 }];
    const mix = (a, b, t) => lerp(a.v, b.v, t);
    assert.equal(sampleKeyframes(keys, 7, mix), 5);
    assert.equal(sampleKeyframes(keys, 10, mix), 20);
    assert.equal(sampleKeyframes(keys, 3, mix), 0);
    assert.equal(sampleKeyframes(keys, 99, mix), 30);
    assert.equal(sampleKeyframes(keys, 8, mix), 10);
  });
});
