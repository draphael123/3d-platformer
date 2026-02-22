import * as THREE from 'three';
import type { PlatformCollider } from '../world';

const SPEED = 3;
const CHASER_SPEED = 3.5;
const CHASER_RANGE = 10;
const HALF_X = 0.4;
const HALF_Y = 0.5;
const HALF_Z = 0.4;

export type EnemyType = 'patrol' | 'chaser';

export class Enemy {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  patrolLeft: number;
  patrolRight: number;
  health: number;
  dead = false;
  readonly type: EnemyType;

  constructor(x: number, y: number, z: number, patrolHalfWidth = 1.5, type: EnemyType = 'patrol') {
    this.type = type;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(-SPEED, 0, 0);
    this.patrolLeft = x - patrolHalfWidth;
    this.patrolRight = x + patrolHalfWidth;
    this.health = 1;
    const geom = new THREE.BoxGeometry(HALF_X * 2, HALF_Y * 2, HALF_Z * 2);
    const color = type === 'chaser' ? 0x4a0080 : 0x8b0000;
    const mat = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    return {
      min: new THREE.Vector3(
        this.position.x - HALF_X,
        this.position.y - HALF_Y,
        this.position.z - HALF_Z
      ),
      max: new THREE.Vector3(
        this.position.x + HALF_X,
        this.position.y + HALF_Y,
        this.position.z + HALF_Z
      ),
    };
  }

  update(dt: number, colliders: PlatformCollider[], playerPosition?: THREE.Vector3): void {
    if (this.dead) return;
    if (this.type === 'chaser' && playerPosition) {
      const dx = playerPosition.x - this.position.x;
      const dz = playerPosition.z - this.position.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      if (distXZ > 0.1 && distXZ <= CHASER_RANGE) {
        this.velocity.x = (dx / distXZ) * CHASER_SPEED;
        this.velocity.z = (dz / distXZ) * CHASER_SPEED;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    } else {
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
      if (this.position.x <= this.patrolLeft) {
        this.position.x = this.patrolLeft;
        this.velocity.x = SPEED;
      }
      if (this.position.x >= this.patrolRight) {
        this.position.x = this.patrolRight;
        this.velocity.x = -SPEED;
      }
    }
    if (this.type === 'chaser') {
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
    }
    this.position.y += this.velocity.y * dt;
    this.velocity.y -= 20 * dt;
    for (const col of colliders) {
      const c = col.position;
      const h = col.size.clone().multiplyScalar(0.5);
      const cMin = new THREE.Vector3(c.x - h.x, c.y - h.y, c.z - h.z);
      const cMax = new THREE.Vector3(c.x + h.x, c.y + h.y, c.z + h.z);
      const box = this.getAABB();
      if (
        box.max.x <= cMin.x ||
        box.min.x >= cMax.x ||
        box.max.y <= cMin.y ||
        box.min.y >= cMax.y ||
        box.max.z <= cMin.z ||
        box.min.z >= cMax.z
      )
        continue;
      const overlapX = Math.min(box.max.x - cMin.x, cMax.x - box.min.x);
      const overlapY = Math.min(box.max.y - cMin.y, cMax.y - box.min.y);
      const overlapZ = Math.min(box.max.z - cMin.z, cMax.z - box.min.z);
      const axis = overlapX < overlapY && overlapX < overlapZ ? 'x' : overlapY < overlapZ ? 'y' : 'z';
      if (axis === 'x') {
        this.velocity.x = 0;
        this.position.x = this.position.x < c.x ? cMin.x - HALF_X : cMax.x + HALF_X;
      } else if (axis === 'y') {
        this.velocity.y = 0;
        this.position.y = this.position.y < c.y ? cMin.y - HALF_Y : cMax.y + HALF_Y;
      } else {
        this.velocity.z = 0;
        this.position.z = this.position.z < c.z ? cMin.z - HALF_Z : cMax.z + HALF_Z;
      }
    }
    this.mesh.position.copy(this.position);
  }
}
