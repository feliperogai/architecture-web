// O halftone aparece só nos voos sobre a cidade, entre uma obra e outra.
// Na parada de cada obra (±0,5 h da sua hora) a cena fica nítida para os detalhes.

export const HALFTONE_START = 8.75;
export const HALFTONE_END = 16.75;
export const HOLD = 0.5;

export function halftoneTarget(hour, projectHours) {
  const inRange = hour >= HALFTONE_START && hour <= HALFTONE_END;
  const holding = projectHours.some((h) => Math.abs(hour - h) <= HOLD);
  return inRange && !holding ? 1 : 0;
}
