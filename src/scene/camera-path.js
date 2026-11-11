import { lerp, smoothstep, sampleKeyframes } from '../time/interpolate.js';

// Enquadramentos fixos (valores iniciais, ajustados na verificação visual).
const FIXED_KEYFRAMES = [
  { hour: 6, position: [0, 3.5, 250], target: [0, 14, 0] }, // amanhecer: rente ao chão, Avenida Meridiana rumo ao norte
  { hour: 8, position: [-40, 40, 200], target: [20, 6, 0] }, // manifesto: sobe sobre a cidade
  { hour: 17.5, position: [200, 26, 90], target: [60, 10, -20] }, // hora dourada
  { hour: 20, position: [-60, 70, 200], target: [40, 6, 0] }, // noite: a cidade acende
  { hour: 23, position: [0, 170, 320], target: [40, 0, 0] }, // vista geral
];

export const REDUCED_MOTION_VIEW = { position: [0, 170, 320], target: [40, 0, 0] };

const toWorld = ([x, z], [px, py, pz]) => [px + x, py, pz + z];

/**
 * Keyframes fixos + um por projeto, em coordenadas absolutas, ordenados por hora.
 * `target` desloca o prédio para o lado oposto à ficha (desktop);
 * `center` é o centro do prédio, usado em telas em pé (a ficha fica embaixo).
 */
export function buildCameraKeyframes(projects) {
  const fixed = FIXED_KEYFRAMES.map((k) => ({ ...k, center: k.target }));
  const fromProjects = projects.map((p) => ({
    hour: p.hour,
    position: toWorld(p.origin, p.camera.position),
    target: toWorld(p.origin, p.camera.target),
    center: toWorld(p.origin, p.camera.center ?? p.camera.target),
  }));
  return [...fixed, ...fromProjects].sort((a, b) => a.hour - b.hour);
}

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Posição, alvo e centro da câmera para uma hora, com easing smoothstep entre keyframes vizinhos. */
export function sampleCamera(hour, keyframes) {
  return sampleKeyframes(keyframes, hour, (a, b, t) => {
    const e = smoothstep(t);
    const view = { position: mix3(a.position, b.position, e), target: mix3(a.target, b.target, e) };
    if (a.center && b.center) view.center = mix3(a.center, b.center, e);
    return view;
  });
}
