import * as THREE from 'three';

const MATERIALS = {
  concrete: new THREE.MeshStandardMaterial({ color: 0xcfc8bc, roughness: 0.92 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.08, metalness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.7 }),
};

/** Um grupo por projeto, com uma caixa por volume. */
export function createBuildings(projects) {
  const group = new THREE.Group();
  for (const project of projects) {
    const building = new THREE.Group();
    building.name = project.id;
    building.position.set(project.origin[0], 0, project.origin[1]);
    for (const volume of project.volumes) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...volume.size), MATERIALS[volume.material]);
      mesh.position.set(...volume.pos);
      mesh.rotation.y = volume.rotY ?? 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      building.add(mesh);
    }
    group.add(building);
  }
  return group;
}
