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

const DEFAULT_ORBIT = 16; // graus girados durante a parada em cada obra
const HOLD = 0.5; // a parada vai de hora − 0,5 a hora + 0,5

/** Gira um ponto em torno do eixo vertical que passa por `center`. */
function rotateAround([x, y, z], [cx, , cz], angle) {
  const dx = x - cx;
  const dz = z - cz;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [cx + dx * c + dz * s, y, cz - dx * s + dz * c];
}

/**
 * Keyframes fixos + dois por obra (início e fim da parada, com a vista girada em torno do centro),
 * em coordenadas absolutas, ordenados por hora.
 * `target` desloca o prédio para o lado oposto à ficha (desktop);
 * `center` é o centro do prédio, usado em telas em pé (a ficha fica embaixo).
 */
export function buildCameraKeyframes(projects) {
  const fixed = FIXED_KEYFRAMES.map((k) => ({ ...k, center: k.target }));
  const fromProjects = projects.flatMap((p) => {
    const center = toWorld(p.origin, p.camera.center ?? p.camera.target);
    const position = toWorld(p.origin, p.camera.position);
    const target = toWorld(p.origin, p.camera.target);
    const half = (((p.camera.orbit ?? DEFAULT_ORBIT) / 2) * Math.PI) / 180;
    return [-1, 1].map((side) => ({
      hour: p.hour + side * HOLD,
      position: rotateAround(position, center, side * half),
      target: rotateAround(target, center, side * half),
      center,
    }));
  });
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

/**
 * Ajusta a vista à obra explodida: sobe alvo e câmera até o meio da pilha de camadas
 * e se afasta, para todas as camadas caberem no quadro. amount = 0 não muda nada.
 */
export function explodeFraming(view, amount, gap, layerCount) {
  if (!amount) return view;
  const stack = gap * (layerCount - 1); // quanto a camada mais alta sobe (m)
  const raise = (amount * stack) / 2;
  const pull = 1 + (amount * stack) / 40; // pilhas mais altas pedem mais recuo
  const lift = (p) => [p[0], p[1] + raise, p[2]];
  const position = view.position.map((v, i) => view.target[i] + (v - view.target[i]) * pull);
  return {
    ...view,
    position: lift(position),
    target: lift(view.target),
    ...(view.center ? { center: lift(view.center) } : {}),
  };
}
