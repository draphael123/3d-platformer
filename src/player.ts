import * as THREE from 'three';
import type { PlatformCollider } from './world';

const MOVE_SPEED = 8;
const JUMP_SPEED = 12;
const GRAVITY = 28;

export interface PlayerInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class Player {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  onGround: boolean;
  private input: PlayerInput;
  private halfSize: THREE.Vector3;

  constructor() {
    const geom = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3498db });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(0, 1, 5);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    this.input = {
      forward: false,
      back: false,
      left: false,
      right: false,
      jump: false,
    };
    this.halfSize = new THREE.Vector3(0.4, 0.8, 0.4);
    this.setupInput();
  }

  private setupInput(): void {
    const keyMap: Record<string, keyof PlayerInput> = {
      w: 'forward',
      s: 'back',
      a: 'left',
      d: 'right',
      ' ': 'jump',
    };
    const onKey = (e: KeyboardEvent, value: boolean) => {
      const key = keyMap[e.key.toLowerCase()];
      if (key) {
        e.preventDefault();
        this.input[key] = value;
      }
    };
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
  }

  private getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const p = this.mesh.position;
    return {
      min: new THREE.Vector3(p.x - this.halfSize.x, p.y - this.halfSize.y, p.z - this.halfSize.z),
      max: new THREE.Vector3(p.x + this.halfSize.x, p.y + this.halfSize.y, p.z + this.halfSize.z),
    };
  }

  private resolveCollision(collider: PlatformCollider): void {
    const box = this.getAABB();
    const c = collider.position;
    const h = collider.size.clone().multiplyScalar(0.5);
    const cMin = new THREE.Vector3(c.x - h.x, c.y - h.y, c.z - h.z);
    const cMax = new THREE.Vector3(c.x + h.x, c.y + h.y, c.z + h.z);

    if (
      box.max.x <= cMin.x ||
      box.min.x >= cMax.x ||
      box.max.y <= cMin.y ||
      box.min.y >= cMax.y ||
      box.max.z <= cMin.z ||
      box.min.z >= cMax.z
    ) {
      return;
    }

    const overlapX = Math.min(box.max.x - cMin.x, cMax.x - box.min.x);
    const overlapY = Math.min(box.max.y - cMin.y, cMax.y - box.min.y);
    const overlapZ = Math.min(box.max.z - cMin.z, cMax.z - box.min.z);

    const axis = overlapX < overlapY && overlapX < overlapZ ? 'x' : overlapY < overlapZ ? 'y' : 'z';
    const p = this.mesh.position;

    if (axis === 'x') {
      this.velocity.x = 0;
      if (p.x < c.x) p.x = cMin.x - this.halfSize.x;
      else p.x = cMax.x + this.halfSize.x;
    } else if (axis === 'y') {
      this.velocity.y = 0;
      if (p.y < c.y) {
        p.y = cMin.y - this.halfSize.y;
      } else {
        p.y = cMax.y + this.halfSize.y;
        this.onGround = true;
      }
    } else {
      this.velocity.z = 0;
      if (p.z < c.z) p.z = cMin.z - this.halfSize.z;
      else p.z = cMax.z + this.halfSize.z;
    }
  }

  update(dt: number, colliders: PlatformCollider[]): void {
    const wasOnGround = this.onGround;
    this.onGround = false;

    const dir = new THREE.Vector3(0, 0, 0);
    if (this.input.forward) dir.z -= 1;
    if (this.input.back) dir.z += 1;
    if (this.input.left) dir.x -= 1;
    if (this.input.right) dir.x += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize();
      this.velocity.x = dir.x * MOVE_SPEED;
      this.velocity.z = dir.z * MOVE_SPEED;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.velocity.y -= GRAVITY * dt;
    if (this.input.jump && wasOnGround) {
      this.velocity.y = JUMP_SPEED;
    }

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    for (const col of colliders) {
      this.resolveCollision(col);
    }

    if (this.mesh.position.y < -10) {
      this.mesh.position.set(0, 1, 5);
      this.velocity.set(0, 0, 0);
    }
  }
}
