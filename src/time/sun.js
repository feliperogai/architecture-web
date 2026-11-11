// Modelo estilizado (não astronômico) do sol num dia de hemisfério sul:
// nasce a leste, passa pelo norte e se põe a oeste.

export const SUNRISE = 6;
export const SUNSET = 18.5;
export const MAX_ALTITUDE = 70;

const DEG = Math.PI / 180;

export function sunPosition(hour, offset = { azimuth: 0, altitude: 0 }) {
  const t = (hour - SUNRISE) / (SUNSET - SUNRISE);
  return {
    altitude: MAX_ALTITUDE * Math.sin(Math.PI * t) + offset.altitude,
    azimuth: 90 - 180 * t + offset.azimuth,
    aboveHorizon: hour >= SUNRISE && hour <= SUNSET,
  };
}

/** Vetor unitário apontando para o sol. Norte = −Z, leste = +X, para cima = +Y. */
export function sunDirection(altitudeDeg, azimuthDeg) {
  const alt = altitudeDeg * DEG;
  const az = azimuthDeg * DEG;
  return {
    x: Math.cos(alt) * Math.sin(az),
    y: Math.sin(alt),
    z: -Math.cos(alt) * Math.cos(az),
  };
}
