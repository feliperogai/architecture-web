import { damp, rateFromFrameFactor } from './time/interpolate.js';
import { computeAnchors, hourFromScroll } from './time/clock.js';
import { sunPosition } from './time/sun.js';
import { skyAt } from './time/sky.js';
import { createHud } from './ui/hud.js';
import { createReveal } from './ui/reveal.js';
import { createSundial } from './ui/sundial.js';
import { createCursor } from './ui/cursor.js';
import { playIntro } from './ui/intro.js';
import { createAnnotations } from './ui/annotations.js';
import { createTypography } from './ui/typography.js';
import { PROJECTS } from './data/projects.js';
import { STACKED_LAYOUT_QUERY } from './layout.js';
import { explodeTarget } from './scene/explode.js';
import { halftoneTarget } from './time/halftone.js';

const PROJECT_HOURS = PROJECTS.map((p) => p.hour);

const root = document.documentElement;
const meridian = document.querySelector('.meridian');

const state = {
  targetHour: 6,
  hour: 6,
  mouse: { x: innerWidth / 2, y: innerHeight * 0.42, nx: 0, ny: 0, moved: false },
  halftone: 0,
  isTouch: matchMedia('(hover: none)').matches,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  webgl: false,
};

const params = new URLSearchParams(location.search);

const hud = createHud(document.querySelector('.hud'));
const reveal = createReveal(document.querySelector('[data-reveal]'));
const sundial = createSundial(document.querySelector('[data-sundial]'));
const cursor = createCursor(document.querySelector('#cursor'), state);
playIntro(document.querySelector('#intro'), { reduced: state.reducedMotion });
const annotations = createAnnotations(document.querySelector('.notes'), PROJECTS);
const typography = createTypography(root, document.querySelector('.hero__title'));

// Lista de detalhes: aberta (só para leitores de tela) no desktop; recolhida no layout empilhado.
const stackedQuery = matchMedia(STACKED_LAYOUT_QUERY);
const syncDetails = () => document.querySelectorAll('.project__more').forEach((d) => { d.open = !stackedQuery.matches; });
stackedQuery.addEventListener('change', syncDetails);
syncDetails();

/* ── Vista explodida: um botão por ficha ── */
const explode = new Map(); // id → { pressed, value, button }
function setPressed(entry, pressed) {
  entry.pressed = pressed;
  entry.button.setAttribute('aria-pressed', String(pressed));
  entry.button.querySelector('.explode__text').textContent = pressed ? 'Montar a obra' : 'Explodir camadas';
}
for (const button of document.querySelectorAll('[data-explode]')) {
  const entry = { pressed: false, value: 0, button };
  explode.set(button.dataset.explode, entry);
  button.addEventListener('click', () => setPressed(entry, !entry.pressed));
}

/* ── Hora a partir da rolagem ── */
let anchors = [];

function measure() {
  const maxScroll = Math.max(0, root.scrollHeight - innerHeight);
  const items = [...document.querySelectorAll('[data-hour]')].map((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    hour: Number(el.dataset.hour),
  }));
  anchors = computeAnchors(items, innerHeight, maxScroll);
}

new ResizeObserver(measure).observe(document.body);
document.fonts?.ready.then(measure);
measure();

/* ── Mouse ── */
addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return;
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.mouse.nx = (event.clientX / innerWidth) * 2 - 1;
  state.mouse.ny = (event.clientY / innerHeight) * 2 - 1;
  state.mouse.moved = true;
}, { passive: true });

/* ── Pintura do céu em CSS (vale com ou sem WebGL) ── */
const painted = { zenith: '', horizon: '', tone: '' };

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

function paintSky(sky, hour) {
  if (sky.zenith !== painted.zenith) {
    painted.zenith = sky.zenith;
    root.style.setProperty('--sky-zenith', sky.zenith);
  }
  if (sky.horizon !== painted.horizon) {
    painted.horizon = sky.horizon;
    root.style.setProperty('--sky-horizon', sky.horizon);
  }
  // Texto fixo do topo: claro sobre céu escuro, escuro sobre céu claro.
  const tone = luminance(sky.zenith) < 0.42 ? 'dark' : 'light';
  if (tone !== painted.tone) {
    painted.tone = tone;
    root.dataset.sky = tone;
  }
  meridian?.style.setProperty('--progress', ((hour - 6) / 17).toFixed(4));
}

/* ── Loop ── */
const HOUR_RATE = rateFromFrameFactor(0.08); // "lerp de 0,08 por quadro" a 60 fps, em qualquer FPS
const HALFTONE_RATE = rateFromFrameFactor(0.06);
const EXPLODE_RATE = rateFromFrameFactor(0.08);
const LENS_RADIUS = 140;
let lastTime = 0;

function update(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.5) : 0;
  lastTime = now;

  // Lida a cada quadro (e não num listener de scroll): funciona igual com rolagem suave, âncoras e teclado.
  state.targetHour = hourFromScroll(scrollY, anchors);
  if (dt === 0) {
    state.hour = state.targetHour; // primeiro quadro: já na hora certa
  } else {
    state.hour = damp(state.hour, state.targetHour, HOUR_RATE, dt);
    if (Math.abs(state.hour - state.targetHour) < 1e-4) state.hour = state.targetHour;
  }

  // Halftone: só nos voos entre as obras (nítido na parada de cada uma), com transição suave.
  // Só faz sentido com a cena 3D; sem WebGL o cursor continua pequeno.
  const halftoneGoal = world ? halftoneTarget(state.hour, PROJECT_HOURS) : 0;
  state.halftone = dt === 0 ? halftoneGoal : damp(state.halftone, halftoneGoal, HALFTONE_RATE, dt);

  const sky = skyAt(state.hour);
  paintSky(sky, state.hour);
  const realSun = sunPosition(state.hour);
  hud.update(state.hour, realSun);
  typography.update(realSun);
  reveal.update();
  sundial.update(state.hour, scrollY);
  const ring = cursor.update(state.mouse, state.halftone, dt);

  if (world) {
    // Lente: no centro do anel do cursor (mesma posição suavizada, então a borda casa com o anel);
    // em toque, ou antes do 1º movimento, fica fixa em (50%, 42%) da área útil.
    const lens = {
      mix: state.halftone,
      lensX: ring ? ring.x : root.clientWidth * 0.5,
      lensY: ring ? ring.y : root.clientHeight * 0.42,
      radius: LENS_RADIUS,
    };
    const offset = state.isTouch
      ? { azimuth: 0, altitude: 0 }
      : { azimuth: state.mouse.nx * 12, altitude: -state.mouse.ny * 5 };
    world.update({
      hour: state.hour,
      sun: sunPosition(state.hour, offset),
      sky,
      mouse: state.mouse,
      reducedMotion: state.reducedMotion,
      halftone: lens,
      time: state.reducedMotion ? 0 : now / 1000,
    });
    for (const project of PROJECTS) {
      const entry = explode.get(project.id);
      if (!entry) continue;
      const target = explodeTarget(state.hour, project.hour, entry.pressed);
      if (entry.pressed && target === 0) setPressed(entry, false); // rolou para longe: fecha
      entry.value = dt === 0 ? target : damp(entry.value, target, EXPLODE_RATE, dt);
      if (Math.abs(entry.value - target) < 1e-3) entry.value = target;
      world.setExplode(project.id, entry.value);
    }
    world.render();
    annotations.update({
      hour: state.hour,
      notePosition: world.notePosition,
      projectNdc: world.projectNdc,
      width: root.clientWidth,
      height: root.clientHeight,
      stacked: stackedQuery.matches,
      layerAnchors: world.layerAnchors,
      explodeValue: (id) => explode.get(id)?.value ?? 0,
    });
  }
}

/* ── Cena 3D (opcional: sem WebGL o fundo CSS continua contando o dia) ── */
let world = null;

function hasWebGL() {
  if (params.has('nowebgl')) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

async function startWorld() {
  if (!hasWebGL()) return;
  try {
    const { createWorld } = await import('./scene/world.js');
    world = createWorld(document.querySelector('#scene'), {
      isTouch: state.isTouch,
      onContextLost() {
        // GPU reiniciou ou o navegador derrubou o contexto: volta para o fundo em CSS.
        world = null;
        state.webgl = false;
        root.classList.add('no-webgl');
      },
    });
    state.webgl = true;
    root.classList.remove('no-webgl');
    addEventListener('resize', () => world?.resize());
  } catch (error) {
    console.warn('Meridiana: cena 3D indisponível, seguindo com o fundo em CSS.', error);
  }
}

let rafId = 0;

function loop(now) {
  update(now);
  rafId = requestAnimationFrame(loop);
}

// Pausa com a aba oculta; ao voltar, o primeiro quadro já pula para a hora certa.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  } else if (!rafId) {
    lastTime = 0;
    rafId = requestAnimationFrame(loop);
  }
});

// Inspeção manual com ?debug: __meridiana.tick() avança um quadro já na hora-alvo,
// útil quando o navegador não está renderizando (aba em segundo plano).
if (params.has('debug')) {
  window.__meridiana = {
    state,
    get world() {
      return world;
    },
    tick() {
      measure();
      state.hour = hourFromScroll(scrollY, anchors);
      update(performance.now());
      return state.hour;
    },
  };
}

root.classList.add('no-webgl');
rafId = requestAnimationFrame(loop);
startWorld();
