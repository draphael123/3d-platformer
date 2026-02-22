import * as THREE from 'three';

export type MovingPath = 'horizontal' | 'vertical' | 'circular';

export class MovingPlatform {
  mesh: THREE.Mesh;
  readonly position: THREE.Vector3;
  readonly size: THREE.Vector3;
  readonly path: MovingPath;
  readonly amount: number;
  readonly speed: number;
  phase = 0;
  private readonly basePosition: THREE.Vector3;
  private prevPosition: THREE.Vector3;
  /** Velocity last frame (for carrying player) */
  readonly velocity: THREE.Vector3;

  constructor(
    x: number,
    y: number,
    z: number,
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    path: MovingPath,
    amount: number,
    speed: number
  ) {
    this.basePosition = new THREE.Vector3(x, y, z);
    this.position = new THREE.Vector3(x, y, z);
    this.prevPosition = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.size = new THREE.Vector3(sizeX, sizeY, sizeZ);
    this.path = path;
    this.amount = amount;
    this.speed = speed;
    const geom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b8e6b });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
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

  update(dt: number): void {
    this.prevPosition.copy(this.position);
    this.phase += dt * this.speed;
    const t = this.phase;
    const a = this.amount;
    const b = this.basePosition;
    switch (this.path) {
      case 'horizontal':
        this.position.x = b.x + a * Math.sin(t);
        this.position.y = b.y;
        this.position.z = b.z;
        break;
      case 'vertical':
        this.position.x = b.x;
        this.position.y = b.y + a * Math.sin(t);
        this.position.z = b.z;
        break;
      case 'circular':
        this.position.x = b.x + a * Math.cos(t);
        this.position.y = b.y;
        this.position.z = b.z + a * Math.sin(t);
        break;
    }
    this.velocity.subVectors(this.position, this.prevPosition).divideScalar(dt > 0 ? dt : 1);
    this.mesh.position.copy(this.position);
  }
}
