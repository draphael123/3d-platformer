import * as THREE from 'three';

const RADIUS = 0.4;

export class DoubleJumpPickup {
  mesh: THREE.Mesh;
  collected = false;
  readonly position: THREE.Vector3;
  private baseY: number;
  private bobTime = Math.random() * Math.PI * 2;
  private material: THREE.MeshStandardMaterial;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.baseY = y;
    const geom = new THREE.SphereGeometry(RADIUS, 16, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x004466,
      emissiveIntensity: 0.2,
    });
    this.material = mat;
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
  }

  animate(dt: number): void {
    if (this.collected) return;
    this.bobTime += dt;
    this.mesh.position.y = this.baseY + Math.sin(this.bobTime) * 0.05;
    this.material.emissiveIntensity = 0.2 + Math.sin(this.bobTime * 2) * 0.1;
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const p = this.mesh.position;
    return {
      min: new THREE.Vector3(p.x - RADIUS, p.y - RADIUS, p.z - RADIUS),
      max: new THREE.Vector3(p.x + RADIUS, p.y + RADIUS, p.z + RADIUS),
    };
  }
}
