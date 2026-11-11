import { lerp, smoothstep, sampleKeyframes } from '../time/interpolate.js';

// Enquadramentos fixos (valores iniciais, ajustados na verificação visual).
const FIXED_KEYFRAMES = [
  { hour: 6, position: [0, 6, 190], target: [20, 8, 0] }, // amanhecer: baixo, na névoa
  { hour: 8, position: [-20, 30, 150], target: [20, 6, 0] }, // manifesto: sobe devagar
  { hour: 17.5, position: [150, 18, 90], target: [40, 10, -20] }, // hora dourada
  { hour: 20, position: [-40, 60, 170], target: [30, 6, -10] }, // noite
  { hour: 23, position: [0, 140, 260], target: [25, 0, -10] }, // vista geral
];

export const REDUCED_MOTION_VIEW = { position: [0, 140, 260], target: [25, 0, -10] };

const toWorld = ([x, z], [px, py, pz]) => [px + x, py, pz + z];

/** Keyframes fixos + um por projeto, em coordenadas absolutas, ordenados por hora. */
export function buildCameraKeyframes(projects) {
  const fromProjects = projects.map((p) => ({
    hour: p.hour,
    position: toWorld(p.origin, p.camera.position),
    target: toWorld(p.origin, p.camera.target),
  }));
  return [...FIXED_KEYFRAMES, ...fromProjects].sort((a, b) => a.hour - b.hour);
}

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Posição e alvo da câmera para uma hora, com easing smoothstep entre keyframes vizinhos. */
export function sampleCamera(hour, keyframes) {
  return sampleKeyframes(keyframes, hour, (a, b, t) => {
    const e = smoothstep(t);
    return { position: mix3(a.position, b.position, e), target: mix3(a.target, b.target, e) };
  });
}
