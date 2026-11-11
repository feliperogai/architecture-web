/** PRNG determinístico (mulberry32): a mesma semente gera sempre a mesma sequência em [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rand, min, max) => min + rand() * (max - min);

export const pick = (rand, list) => list[Math.floor(rand() * list.length)];
