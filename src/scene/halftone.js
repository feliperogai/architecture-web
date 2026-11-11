import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const CELL_CSS_PX = 7;
const FEATHER_CSS_PX = 24;

// Roda depois do OutputPass, então trabalha com cores já em sRGB:
// o papel é passado como valores sRGB crus (Vector3), sem conversão de espaço de cor.
const PAPER_SRGB = new THREE.Vector3(0xf3 / 255, 0xef / 255, 0xe7 / 255);

const HalftoneLensShader = {
  name: 'HalftoneLensShader',
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uCell: { value: CELL_CSS_PX },
    uMix: { value: 0 },
    uLens: { value: new THREE.Vector3(0, 0, 140) },
    uFeather: { value: FEATHER_CSS_PX },
    uPaper: { value: PAPER_SRGB.clone() },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uCell;
    uniform float uMix;
    uniform vec3 uLens;
    uniform float uFeather;
    uniform vec3 uPaper;
    varying vec2 vUv;

    void main() {
      vec2 px = vUv * uResolution;
      vec2 center = (floor(px / uCell) + 0.5) * uCell;
      vec3 c = texture2D(tDiffuse, center / uResolution).rgb;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      float r = uCell * 0.5 * sqrt(1.0 - clamp(lum, 0.0, 1.0)) * 1.15;
      float dotMask = 1.0 - smoothstep(r - 1.0, r + 1.0, length(px - center));
      vec3 ht = mix(uPaper, c, dotMask);
      vec3 orig = texture2D(tDiffuse, vUv).rgb;
      float lens = 1.0 - smoothstep(uLens.z - uFeather, uLens.z, length(px - uLens.xy));
      gl_FragColor = vec4(mix(orig, ht, uMix * (1.0 - lens)), 1.0);
    }
  `,
};

export function createHalftonePass() {
  const pass = new ShaderPass(HalftoneLensShader);
  pass.enabled = false;
  return pass;
}

/** Converte px CSS em px de dispositivo (origem embaixo à esquerda) e liga o passe só quando visível. */
export function updateHalftone(pass, { mix, lensX, lensY, radius, width, height, pixelRatio }) {
  const u = pass.uniforms;
  u.uMix.value = mix;
  u.uResolution.value.set(width * pixelRatio, height * pixelRatio);
  u.uCell.value = CELL_CSS_PX * pixelRatio;
  u.uFeather.value = FEATHER_CSS_PX * pixelRatio;
  u.uLens.value.set(lensX * pixelRatio, (height - lensY) * pixelRatio, radius * pixelRatio);
  pass.enabled = mix > 0.001;
}
