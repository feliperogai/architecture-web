import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { sunPosition, sunDirection } from '../../src/time/sun.js';

describe('sunPosition', () => {
  it('nascer', () => {
    const s = sunPosition(6);
    assertClose(s.altitude, 0);
    assertClose(s.azimuth, 90);
    assert.equal(s.aboveHorizon, true);
  });

  it('meio-dia solar (12:15)', () => {
    const s = sunPosition(12.25);
    assertClose(s.altitude, 70);
    assertClose(s.azimuth, 0);
  });

  it('pôr', () => {
    const s = sunPosition(18.5);
    assertClose(s.altitude, 0);
    assertClose(s.azimuth, -90);
  });

  it('noite', () => {
    const s = sunPosition(21);
    assert.equal(s.aboveHorizon, false);
    assert.ok(s.altitude < 0);
  });

  it('offset do mouse', () => {
    const s = sunPosition(12.25, { azimuth: 12, altitude: -5 });
    assertClose(s.azimuth, 12);
    assertClose(s.altitude, 65);
  });
});

describe('sunDirection', () => {
  it('leste = +X', () => {
    const d = sunDirection(0, 90);
    assertClose(d.x, 1);
    assertClose(d.y, 0);
    assertClose(d.z, 0);
  });

  it('norte = −Z', () => {
    assertClose(sunDirection(0, 0).z, -1);
  });

  it('zênite = +Y', () => {
    assertClose(sunDirection(90, 0).y, 1);
  });
});
