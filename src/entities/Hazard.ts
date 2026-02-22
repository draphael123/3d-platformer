import * as THREE from 'three';

export class Hazard {
  position: THREE.Vector3;
  size: THREE.Vector3;
  mesh: THREE.Mesh;
  readonly damageOverTime: boolean;
  readonly oneWay: boolean;
  lastHurtTime = 0;
  private material: THREE.MeshStandardMaterial;
  private pulseTime = Math.random() * Math.PI * 2;

  constructor(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    damageOverTime = false,
    oneWay = false
  ) {
    this.position = new THREE.Vector3(x, y, z);
    this.size = new THREE.Vector3(sx, sy, sz);
    this.damageOverTime = damageOverTime;
    this.oneWay = oneWay;
    const geom = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      emissive: 0x440000,
      emissiveIntensity: 0.25,
    });
    this.material = mat;
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(x, y, z);
  }

  update(dt: number): void {
    this.pulseTime += dt;
    this.material.emissiveIntensity = 0.25 + Math.sin(this.pulseTime * 1.5) * 0.12;
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const h = this.size.clone().multiplyScalar(0.5);
    return {
      min: new THREE.Vector3(
        this.position.x - h.x,
        this.position.y - h.y,
        this.position.z - h.z
      ),
      max: new THREE.Vector3(
        this.position.x + h.x,
        this.position.y + h.y,
        this.position.z + h.z
      ),
    };
  }
}
