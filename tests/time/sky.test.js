import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { skyAt, SKY_KEYFRAMES } from '../../src/time/sky.js';

describe('skyAt', () => {
  it('8 keyframes ordenados', () => {
    assert.deepEqual(SKY_KEYFRAMES.map((k) => k.hour), [6, 8, 12, 16, 17.5, 18.5, 20, 23]);
  });

  it('valor exato no keyframe', () => {
    const s = skyAt(12);
    assert.equal(s.zenith, '#4f8fd6');
    assert.equal(s.horizon, '#dfeaf3');
    assert.equal(s.intensity, 2.4);
  });

  it('interpola no meio do trecho', () => {
    assertClose(skyAt(10).intensity, 2.0);
    assert.equal(skyAt(10).light, '#fff1e2');
  });

  it('trava nos extremos', () => {
    assert.equal(skyAt(-5).zenith, '#3b3a6b');
    assert.equal(skyAt(30).zenith, '#05070f');
  });

  it('névoa', () => {
    // Calibrada para a escala da cena (metros): ~50% de visibilidade a 120 m ao amanhecer.
    assertClose(skyAt(6).fogDensity, 0.007, 5);
    assertClose(skyAt(9).fogDensity, 0.0022, 5);
    assertClose(skyAt(12).fogDensity, 0.0022, 5);
  });

  it('janelas e estrelas', () => {
    assert.equal(skyAt(18.5).windowGlow, 0);
    assert.equal(skyAt(20).windowGlow, 1);
    assert.equal(skyAt(18.5).starOpacity, 0);
    assert.equal(skyAt(20.5).starOpacity, 1);
  });
});
