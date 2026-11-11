import * as THREE from 'three';

/** Estrelas no hemisfério de cima; a opacidade acompanha a noite. Acompanha a câmera. */
export function createStars(count = 1500, radius = 900) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Direção uniforme no hemisfério superior, evitando a faixa do horizonte
    const y = 0.06 + Math.random() * 0.94;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    positions.set([r * Math.cos(theta) * radius, y * radius, r * Math.sin(theta) * radius], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xfff6e0,
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;

  return {
    points,
    update(opacity) {
      material.opacity = opacity;
      points.visible = opacity > 0.01;
    },
  };
}
