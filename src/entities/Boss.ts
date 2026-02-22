import * as THREE from 'three';
import type { PlatformCollider } from '../world';

const SPEED = 2;
const PHASE2_SPEED = 3.5;
const CHARGE_SPEED = 14;
const TELEGRAPH_DURATION = 0.3;
const CHARGE_DURATION = 0.5;
const TIME_BETWEEN_CHARGES = 4;
const HALF_X = 0.7;
const HALF_Y = 0.8;
const HALF_Z = 0.7;
const MAX_HEALTH = 3;

type BossState = 'idle' | 'telegraph' | 'charge';

export class Boss {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  dead = false;
  private flashEndTime = 0;
  private state: BossState = 'idle';
  private stateTime = 0;
  private chargeDirection = new THREE.Vector3(1, 0, 0);
  private lastChargeTime = -10;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(-SPEED, 0, 0);
    this.health = MAX_HEALTH;
    const geom = new THREE.BoxGeometry(HALF_X * 2, HALF_Y * 2, HALF_Z * 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a0080, emissive: 0x220044 });
    this.material = mat;
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
  }

  flashHit(untilTime: number): void {
    this.flashEndTime = untilTime;
    this.material.emissive.setHex(0xcc2222);
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
    const now = performance.now() / 1000;
    if (now >= this.flashEndTime && this.flashEndTime > 0) {
      this.material.emissive.setHex(0x220044);
      this.flashEndTime = 0;
    }

    const phase2 = this.health <= 2;
    const baseSpeed = phase2 ? PHASE2_SPEED : SPEED;

    this.stateTime += dt;

    if (this.state === 'idle') {
      if (phase2 && playerPosition && now - this.lastChargeTime >= TIME_BETWEEN_CHARGES) {
        this.state = 'telegraph';
        this.stateTime = 0;
        this.material.emissive.setHex(0xff6600);
        this.mesh.scale.setScalar(1.15);
      } else {
        this.velocity.x += 0;
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        if (this.position.x <= -8) this.velocity.x = baseSpeed;
        if (this.position.x >= 8) this.velocity.x = -baseSpeed;
        if (this.position.z <= -8) this.velocity.z = baseSpeed;
        if (this.position.z >= 8) this.velocity.z = -baseSpeed;
      }
    } else if (this.state === 'telegraph') {
      if (this.stateTime >= TELEGRAPH_DURATION) {
        this.state = 'charge';
        this.stateTime = 0;
        this.material.emissive.setHex(0x220044);
        this.mesh.scale.setScalar(1);
        if (playerPosition) {
          this.chargeDirection.subVectors(playerPosition, this.position).setY(0).normalize();
          this.velocity.x = this.chargeDirection.x * CHARGE_SPEED;
          this.velocity.z = this.chargeDirection.z * CHARGE_SPEED;
        }
        this.lastChargeTime = now;
      }
    } else if (this.state === 'charge') {
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
      if (this.stateTime >= CHARGE_DURATION) {
        this.state = 'idle';
        this.stateTime = 0;
        this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
        this.velocity.z = (Math.random() > 0.5 ? 1 : -1) * baseSpeed * 0.5;
      }
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
      this.velocity.y = 0;
      this.position.y = cMax.y + HALF_Y;
    }
    this.mesh.position.copy(this.position);
  }
}
