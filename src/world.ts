import * as THREE from 'three';

export interface PlatformCollider {
  position: THREE.Vector3;
  size: THREE.Vector3;
}

export interface WorldResult {
  scene: THREE.Group;
  colliders: PlatformCollider[];
}

export function createWorld(): WorldResult {
  const group = new THREE.Group();
  const colliders: PlatformCollider[] = [];

  // Ground
  const groundGeom = new THREE.BoxGeometry(40, 1, 40);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  group.add(ground);
  colliders.push({
    position: new THREE.Vector3(0, 0, 0),
    size: new THREE.Vector3(40, 1, 40),
  });

  // Platforms
  const platformData: [number, number, number, number, number, number][] = [
    [3, 0.5, 0, 3, 1, 3],
    [-4, 0.5, 5, 2.5, 1, 2.5],
    [5, 0.5, -4, 2, 1, 2],
    [-2, 1.5, -3, 2, 1, 2],
    [0, 2, 4, 2.5, 1, 2.5],
  ];
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
  for (const [px, py, pz, sx, sy, sz] of platformData) {
    const geom = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geom, platformMat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push({
      position: new THREE.Vector3(px, py, pz),
      size: new THREE.Vector3(sx, sy, sz),
    });
  }

  return { scene: group, colliders };
}
