import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAnchors, hourFromScroll, formatHour } from '../../src/time/clock.js';

describe('computeAnchors', () => {
  it('centraliza e trava no intervalo rolável', () => {
    const a = computeAnchors([{ top: 0, hour: 6 }, { top: 1000, hour: 8 }, { top: 5000, hour: 23 }], 800, 3000);
    assert.deepEqual(a, [{ y: 0, hour: 6 }, { y: 600, hour: 8 }, { y: 3000, hour: 23 }]);
  });
});

describe('hourFromScroll', () => {
  const anchors = [{ y: 0, hour: 6 }, { y: 600, hour: 8 }, { y: 3000, hour: 23 }];

  it('interpola por trechos', () => {
    assert.equal(hourFromScroll(300, anchors), 7);
    assert.equal(hourFromScroll(1800, anchors), 15.5);
  });

  it('trava nos extremos (rolagem elástica)', () => {
    assert.equal(hourFromScroll(-120, anchors), 6);
    assert.equal(hourFromScroll(9999, anchors), 23);
  });

  it('âncoras empatadas não geram NaN; vale a de hora maior', () => {
    const tied = [{ y: 0, hour: 6 }, { y: 0, hour: 8 }, { y: 0, hour: 23 }];
    assert.equal(hourFromScroll(0, tied), 23);
    const partial = [{ y: 0, hour: 6 }, { y: 0, hour: 8 }, { y: 100, hour: 10 }];
    assert.equal(hourFromScroll(0, partial), 8);
    assert.equal(hourFromScroll(50, partial), 9);
  });

  it('sem âncoras retorna 6', () => {
    assert.equal(hourFromScroll(100, []), 6);
  });
});

describe('formatHour', () => {
  it('formata HH:MM', () => {
    assert.equal(formatHour(6), '06:00');
    assert.equal(formatHour(17.5), '17:30');
    assert.equal(formatHour(23), '23:00');
    assert.equal(formatHour(6.99), '06:59');
  });

  it('arredonda ao minuto mais próximo (rolagem cai em pixel inteiro)', () => {
    assert.equal(formatHour(13.9995), '14:00');
    assert.equal(formatHour(6.999), '07:00');
  });
});
