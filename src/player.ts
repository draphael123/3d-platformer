import * as THREE from 'three';
import type { PlatformCollider } from './world';

const MOVE_SPEED = 8;
const JUMP_SPEED = 12;
const GRAVITY = 28;
const COYOTE_TIME = 0.12;
const JUMP_BUFFER_TIME = 0.15;
const JUMP_CUT_MULTIPLIER = 0.5; // variable jump height: when jump released early
const SPRINT_MULTIPLIER = 1.35;

export interface PlayerInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
}

export class Player {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  onGround: boolean;
  /** True for one frame when player just landed. */
  justLanded = false;
  /** True for one frame when player just jumped. */
  justJumped = false;
  /** Extra jumps remaining (from power-up); one consumed per double jump. */
  doubleJumpRemaining = 0;
  get sprinting(): boolean {
    return this.input.sprint;
  }
  private input: PlayerInput;
  private halfSize: THREE.Vector3;
  private coyoteTimeLeft = 0;
  private jumpBufferTimeLeft = 0;
  private canCutJump = false;
  private justUsedDoubleJump = false;

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
      sprint: false,
    };
    this.halfSize = new THREE.Vector3(0.4, 0.8, 0.4);
    this.setupInput();
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  getAABB(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const p = this.mesh.position;
    return {
      min: new THREE.Vector3(p.x - this.halfSize.x, p.y - this.halfSize.y, p.z - this.halfSize.z),
      max: new THREE.Vector3(p.x + this.halfSize.x, p.y + this.halfSize.y, p.z + this.halfSize.z),
    };
  }

  private setupInput(): void {
    const keyMap: Record<string, keyof PlayerInput> = {
      w: 'forward',
      s: 'back',
      a: 'left',
      d: 'right',
      ' ': 'jump',
      shift: 'sprint',
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
    this.justLanded = false;
    this.justJumped = false;

    if (wasOnGround && !this.onGround) this.coyoteTimeLeft = COYOTE_TIME;
    this.coyoteTimeLeft -= dt;
    if (this.input.jump) this.jumpBufferTimeLeft = JUMP_BUFFER_TIME;
    this.jumpBufferTimeLeft -= dt;

    const dir = new THREE.Vector3(0, 0, 0);
    if (this.input.forward) dir.z -= 1;
    if (this.input.back) dir.z += 1;
    if (this.input.left) dir.x -= 1;
    if (this.input.right) dir.x += 1;
    const speed = MOVE_SPEED * (this.input.sprint ? SPRINT_MULTIPLIER : 1);
    if (dir.lengthSq() > 0) {
      dir.normalize();
      this.velocity.x = dir.x * speed;
      this.velocity.z = dir.z * speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.velocity.y -= GRAVITY * dt;
    if (!this.input.jump && this.velocity.y > 0 && this.canCutJump) {
      this.velocity.y *= JUMP_CUT_MULTIPLIER;
      this.canCutJump = false;
    }
    const canCoyoteJump = this.coyoteTimeLeft > 0;
    if ((this.input.jump && (wasOnGround || canCoyoteJump)) || (this.jumpBufferTimeLeft > 0 && wasOnGround)) {
      this.velocity.y = JUMP_SPEED;
      this.justJumped = true;
      this.canCutJump = true;
      this.coyoteTimeLeft = 0;
      this.jumpBufferTimeLeft = 0;
    } else if (!wasOnGround && this.input.jump && this.doubleJumpRemaining > 0 && !this.justUsedDoubleJump) {
      this.velocity.y = JUMP_SPEED;
      this.justJumped = true;
      this.canCutJump = true;
      this.doubleJumpRemaining--;
      this.justUsedDoubleJump = true;
    }

    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    for (const col of colliders) {
      this.resolveCollision(col);
    }
    if (this.onGround) {
      this.coyoteTimeLeft = 0;
      this.canCutJump = false;
      this.justUsedDoubleJump = false;
      if (this.jumpBufferTimeLeft > 0) {
        this.velocity.y = JUMP_SPEED;
        this.justJumped = true;
        this.canCutJump = true;
        this.jumpBufferTimeLeft = 0;
      }
    }
    if (this.onGround && !wasOnGround) this.justLanded = true;

    if (this.mesh.position.y < -10) {
      this.mesh.position.set(0, 1, 5);
      this.velocity.set(0, 0, 0);
    }
  }
}
