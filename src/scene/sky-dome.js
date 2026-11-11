import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uSunVisible;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 color = mix(uHorizon, uZenith, pow(h, 0.55));
    float s = max(dot(dir, normalize(uSunDir)), 0.0);
    color += uSunColor * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.18) * uSunVisible;
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Esfera invertida com degradê horizonte → zênite e brilho do sol. Acompanha a câmera. */
export function createSkyDome() {
  const uniforms = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunColor: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunVisible: { value: 1 },
  };

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 48, 24),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;

  return {
    mesh,
    update(sky, sunDir, sunVisible) {
      uniforms.uZenith.value.set(sky.zenith);
      uniforms.uHorizon.value.set(sky.horizon);
      uniforms.uSunColor.value.set(sky.light);
      uniforms.uSunDir.value.set(sunDir.x, sunDir.y, sunDir.z);
      uniforms.uSunVisible.value = sunVisible;
    },
  };
}
