import assert from 'node:assert/strict';

// Equivalente ao toBeCloseTo do Jest/Vitest: |actual - expected| < 10^-precision / 2
export function assertClose(actual, expected, precision = 2) {
  const tolerance = 10 ** -precision / 2;
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `esperado ~${expected} (±${tolerance}), recebido ${actual}`,
  );
}
