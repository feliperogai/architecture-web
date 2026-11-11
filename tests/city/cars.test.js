import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertClose } from '../helpers.js';
import { carPosition, generateCity, CITY_DEFAULTS } from '../../src/city/generate.js';

const lane = { start: [0, 0], end: [0, -100] }; // rumo ao norte
describe('carros', () => {
  it('anda ao longo da faixa e dá a volta', () => {
    const car = { lane: 0, phase: 10, speed: 5 };
    assert.deepEqual([carPosition(car, lane, 0).x, carPosition(car, lane, 0).z], [0, -10]);
    assertClose(carPosition(car, lane, 2).z, -20);
    assertClose(carPosition(car, lane, 20).z, -10); // 10 + 100 = 110 mod 100
  });
  it('rotY aponta para onde o carro vai', () => {
    assertClose(Math.abs(carPosition({ lane: 0, phase: 0, speed: 1 }, lane, 0).rotY), Math.PI);
  });
  it('70 carros, velocidades 6–11, cada um numa faixa existente', () => {
    const city = generateCity(CITY_DEFAULTS, []);
    assert.equal(city.cars.length, 70);
    assert.ok(city.cars.every((c) => c.speed >= 6 && c.speed <= 11 && city.lanes[c.lane]));
    assert.equal(city.lanes.length, city.streets.length * 2);
  });
});
