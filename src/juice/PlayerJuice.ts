import * as THREE from 'three';

const LAND_SQUASH = new THREE.Vector3(1.2, 0.7, 1.2);
const JUMP_STRETCH = new THREE.Vector3(0.9, 1.15, 0.9);
const BASE_SCALE = new THREE.Vector3(1, 1, 1);
const LAND_DURATION = 0.12;
const JUMP_DURATION = 0.1;

interface JuiceState {
  t: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  duration: number;
}

export function updatePlayerJuice(
  mesh: THREE.Mesh,
  justLanded: boolean,
  justJumped: boolean,
  dt: number
): void {
  if (justLanded) {
    mesh.scale.copy(LAND_SQUASH);
    (mesh as THREE.Mesh & { _juice?: JuiceState })._juice = {
      t: 0,
      from: LAND_SQUASH.clone(),
      to: BASE_SCALE.clone(),
      duration: LAND_DURATION,
    };
  }
  if (justJumped) {
    mesh.scale.copy(JUMP_STRETCH);
    (mesh as THREE.Mesh & { _juice?: JuiceState })._juice = {
      t: 0,
      from: JUMP_STRETCH.clone(),
      to: BASE_SCALE.clone(),
      duration: JUMP_DURATION,
    };
  }
  const j = (mesh as THREE.Mesh & { _juice?: JuiceState })._juice;
  if (j && j.t < 1) {
    j.t = Math.min(1, j.t + dt / j.duration);
    const s = j.t;
    mesh.scale.lerpVectors(j.from, j.to, s);
    if (j.t >= 1) (mesh as THREE.Mesh & { _juice?: JuiceState })._juice = undefined;
  }
}

export function resetPlayerJuiceScale(mesh: THREE.Mesh): void {
  mesh.scale.set(1, 1, 1);
  (mesh as THREE.Mesh & { _juice?: unknown })._juice = undefined;
}
