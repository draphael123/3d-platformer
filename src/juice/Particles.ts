import * as THREE from 'three';

const MAX_PARTICLES = 600;
const POSITION_ITEM_SIZE = 3;

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  gravity: number;
}

export interface EmitConfig {
  count?: number;
  color?: number;
  lifetime?: number;
  size?: number;
  speed?: number;
  gravity?: number;
  spread?: number; // 0-1, how much random direction
}

const defaultConfig: Required<EmitConfig> = {
  count: 12,
  color: 0x888888,
  lifetime: 0.4,
  size: 0.15,
  speed: 3,
  gravity: 5,
  spread: 0.8,
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function spreadDir(out: THREE.Vector3, spread: number): void {
  out.set(rand(-1, 1), rand(0.5, 1), rand(-1, 1)).normalize();
  const s = 1 - spread * 0.7;
  out.x *= s; out.y *= s; out.z *= s;
  out.normalize();
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private points: THREE.Points;
  private positions: Float32Array;
  private sizes: Float32Array;
  private colors: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  constructor() {
    const num = MAX_PARTICLES;
    this.positions = new Float32Array(num * POSITION_ITEM_SIZE);
    this.sizes = new Float32Array(num);
    this.colors = new Float32Array(num * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, 0);
    this.material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geometry, this.material);
  }

  getObject(): THREE.Points {
    return this.points;
  }

  emit(position: THREE.Vector3, config: EmitConfig = {}): void {
    const cfg = { ...defaultConfig, ...config };
    const { count, color, lifetime, size, speed, gravity, spread } = cfg;
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    const dir = new THREE.Vector3();
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      spreadDir(dir, spread);
      this.particles.push({
        x: position.x,
        y: position.y,
        z: position.z,
        vx: dir.x * speed * rand(0.5, 1.5),
        vy: dir.y * speed * rand(0.5, 1.5),
        vz: dir.z * speed * rand(0.5, 1.5),
        life: lifetime,
        maxLife: lifetime,
        size: size * rand(0.7, 1.3),
        r, g, b,
        gravity,
      });
    }
  }

  update(dt: number): void {
    let i = 0;
    while (i < this.particles.length) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      i++;
    }
    const pos = this.positions;
    const siz = this.sizes;
    const col = this.colors;
    const n = this.particles.length;
    for (let j = 0; j < n; j++) {
      const p = this.particles[j];
      pos[j * 3] = p.x;
      pos[j * 3 + 1] = p.y;
      pos[j * 3 + 2] = p.z;
      const t = 1 - p.life / p.maxLife;
      siz[j] = p.size * (1 - t);
      col[j * 3] = p.r;
      col[j * 3 + 1] = p.g;
      col[j * 3 + 2] = p.b;
    }
    this.geometry.setDrawRange(0, n);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

export function dust(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 10, color: 0xaaaaaa, lifetime: 0.35, size: 0.12, speed: 2, gravity: 2, spread: 0.9 });
}

export function coinCollect(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 14, color: 0xffd700, lifetime: 0.4, size: 0.1, speed: 4, gravity: 0, spread: 0.7 });
}

export function enemyDeath(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 18, color: 0x8b0000, lifetime: 0.5, size: 0.15, speed: 5, gravity: 8, spread: 0.85 });
}

export function bossHit(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 12, color: 0xff4444, lifetime: 0.3, size: 0.12, speed: 4, gravity: 4, spread: 0.8 });
}

export function bossDeath(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 35, color: 0x4a0080, lifetime: 0.6, size: 0.18, speed: 6, gravity: 10, spread: 0.9 });
}

export function sprintDust(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 5, color: 0xaaaaaa, lifetime: 0.25, size: 0.08, speed: 1.5, gravity: 1, spread: 0.95 });
}

export function fallWind(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 4, color: 0xccccdd, lifetime: 0.3, size: 0.06, speed: 2, gravity: -0.5, spread: 0.6 });
}

export function hazardSizzle(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 3, color: 0xff6600, lifetime: 0.4, size: 0.1, speed: 1, gravity: 0.5, spread: 0.9 });
}

export function coinCollectBig(system: ParticleSystem, position: THREE.Vector3): void {
  system.emit(position, { count: 22, color: 0xffd700, lifetime: 0.5, size: 0.14, speed: 5, gravity: 0, spread: 0.7 });
}
