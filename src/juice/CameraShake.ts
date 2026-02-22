import * as THREE from 'three';

let intensity = 0;
let duration = 0;
const offset = new THREE.Vector3(0, 0, 0);

function rand(): number {
  return (Math.random() - 0.5) * 2;
}

export function shake(amount: number, time: number): void {
  if (amount > intensity || time > duration) {
    intensity = amount;
    duration = time;
  }
}

export function updateCameraShake(dt: number): THREE.Vector3 {
  if (duration <= 0) {
    offset.set(0, 0, 0);
    return offset.clone();
  }
  duration -= dt;
  const t = duration > 0 ? intensity * (duration / (duration + dt)) : 0;
  offset.set(rand() * t, rand() * t, rand() * t);
  return offset.clone();
}
