import * as THREE from 'three';

const BASE_RADIUS = 0.3;
const HALF_HEIGHT = 0.1;

function radiusForValue(value: number): number {
  if (value >= 50) return BASE_RADIUS * 1.4;
  if (value >= 25) return BASE_RADIUS * 1.15;
  return BASE_RADIUS;
}

function colorForValue(value: number): number {
  if (value >= 50) return 0xffaa00;
  if (value >= 25) return 0xc0c0c0;
  return 0xffd700;
}

export class Coin {
  mesh: THREE.Mesh;
  collected = false;
  readonly position: THREE.Vector3;
  readonly value: number;
  private baseY: number;
  private bobTime = Math.random() * Math.PI * 2;
  private material: THREE.MeshStandardMaterial;

  constructor(x: number, y: number, z: number, value = 10) {
    this.value = value;
    this.baseY = y;
    const r = radiusForValue(value);
    const geom = new THREE.CylinderGeometry(r, r, HALF_HEIGHT * 2, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: colorForValue(value),
      metalness: 0.8,
      roughness: 0.2,
      emissive: colorForValue(value),
      emissiveIntensity: 0.15,
    });
    this.material = mat;
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.position = new THREE.Vector3(x, y, z);
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const r = radiusForValue(this.value);
    const y = this.mesh.position.y;
    return {
      min: new THREE.Vector3(
        this.position.x - r,
        y - HALF_HEIGHT,
        this.position.z - r
      ),
      max: new THREE.Vector3(
        this.position.x + r,
        y + HALF_HEIGHT,
        this.position.z + r
      ),
    };
  }

  animate(dt: number): void {
    if (this.collected) return;
    this.bobTime += dt;
    this.mesh.position.y = this.baseY + Math.sin(this.bobTime) * 0.04;
    this.mesh.rotation.y += dt * 4;
    this.material.emissiveIntensity = 0.15 + Math.sin(this.bobTime * 2) * 0.08;
  }
}

export function aabbOverlap(
  aMin: THREE.Vector3,
  aMax: THREE.Vector3,
  bMin: THREE.Vector3,
  bMax: THREE.Vector3
): boolean {
  return !(aMax.x <= bMin.x || aMin.x >= bMax.x || aMax.y <= bMin.y || aMin.y >= bMax.y || aMax.z <= bMin.z || aMin.z >= bMax.z);
}
