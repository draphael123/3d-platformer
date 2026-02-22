import * as THREE from 'three';
import { getReducedMotion } from '../settings';

let intensity = 0;
let duration = 0;
const offset = new THREE.Vector3(0, 0, 0);

function rand(): number {
  return (Math.random() - 0.5) * 2;
}

export function shake(amount: number, time: number): void {
  const scale = getReducedMotion() ? 0.2 : 1;
  const a = amount * scale;
  const t = time * scale;
  if (a > intensity || t > duration) {
    intensity = a;
    duration = t;
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
