import { damp, rateFromFrameFactor } from './time/interpolate.js';
import { computeAnchors, hourFromScroll } from './time/clock.js';
import { sunPosition } from './time/sun.js';
import { skyAt } from './time/sky.js';
import { createHud } from './ui/hud.js';
import { createReveal } from './ui/reveal.js';
import { createSundial } from './ui/sundial.js';
import { createCursor } from './ui/cursor.js';
import { playIntro } from './ui/intro.js';

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

  const sky = skyAt(state.hour);
  paintSky(sky, state.hour);
  hud.update(state.hour, sunPosition(state.hour));
  reveal.update();
  sundial.update(state.hour, scrollY);
  cursor.update(state.mouse, state.halftone, dt);

  if (world) {
    const offset = state.isTouch
      ? { azimuth: 0, altitude: 0 }
      : { azimuth: state.mouse.nx * 12, altitude: -state.mouse.ny * 5 };
    world.update({
      hour: state.hour,
      sun: sunPosition(state.hour, offset),
      sky,
      mouse: state.mouse,
      reducedMotion: state.reducedMotion,
    });
    world.render();
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
    world = createWorld(document.querySelector('#scene'), { isTouch: state.isTouch });
    state.webgl = true;
    root.classList.remove('no-webgl');
    addEventListener('resize', () => world.resize(innerWidth, innerHeight));
  } catch (error) {
    console.warn('Meridiana: cena 3D indisponível, seguindo com o fundo em CSS.', error);
  }
}

function loop(now) {
  update(now);
  requestAnimationFrame(loop);
}

// Inspeção manual com ?debug: __meridiana.tick() avança um quadro já na hora-alvo,
// útil quando o navegador não está renderizando (aba em segundo plano).
if (params.has('debug')) {
  window.__meridiana = {
    state,
    tick() {
      measure();
      state.hour = hourFromScroll(scrollY, anchors);
      update(performance.now());
      return state.hour;
    },
  };
}

root.classList.add('no-webgl');
requestAnimationFrame(loop);
startWorld();
