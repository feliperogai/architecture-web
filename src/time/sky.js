import { lerp, lerpColor, smoothstep, sampleKeyframes } from './interpolate.js';

export const SKY_KEYFRAMES = [
  { hour: 6, zenith: '#3b3a6b', horizon: '#f2a7a0', light: '#ffb08a', intensity: 0.6 },
  { hour: 8, zenith: '#6f9fd8', horizon: '#f6dcc4', light: '#ffe2c4', intensity: 1.6 },
  { hour: 12, zenith: '#4f8fd6', horizon: '#dfeaf3', light: '#ffffff', intensity: 2.4 },
  { hour: 16, zenith: '#5a8fcf', horizon: '#f0e2c8', light: '#fff0d8', intensity: 2.0 },
  { hour: 17.5, zenith: '#6b7fb8', horizon: '#f7b267', light: '#ffb35c', intensity: 1.4 },
  { hour: 18.5, zenith: '#3a3f78', horizon: '#e07a6a', light: '#ff7a50', intensity: 0.4 },
  { hour: 20, zenith: '#0f1430', horizon: '#2b2d5a', light: '#8fa6ff', intensity: 0.25 },
  { hour: 23, zenith: '#05070f', horizon: '#11152b', light: '#8fa6ff', intensity: 0.15 },
];

function mixSky(a, b, t) {
  return {
    zenith: lerpColor(a.zenith, b.zenith, t),
    horizon: lerpColor(a.horizon, b.horizon, t),
    light: lerpColor(a.light, b.light, t),
    intensity: lerp(a.intensity, b.intensity, t),
  };
}

export function skyAt(hour) {
  return {
    ...sampleKeyframes(SKY_KEYFRAMES, hour, mixSky),
    fogDensity: lerp(0.022, 0.0045, smoothstep((hour - 6) / 3)),
    windowGlow: smoothstep((hour - 18.5) / 1.5),
    starOpacity: smoothstep((hour - 18.5) / 2),
  };
}
