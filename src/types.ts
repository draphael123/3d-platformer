import type * as THREE from 'three';

export interface PlatformCollider {
  position: THREE.Vector3;
  size: THREE.Vector3;
}

export type PlatformData = [number, number, number, number, number, number]; // px, py, pz, sx, sy, sz
export type Vec3 = [number, number, number];

/** Coin as [x,y,z] (value 10) or { position, value? } */
export type CoinDef = Vec3 | { position: Vec3; value?: number };

export interface LevelData {
  name: string;
  spawn: Vec3;
  groundSize: [number, number];
  platforms: PlatformData[];
  coins: CoinDef[];
  enemies: { position: Vec3; patrol?: number; type?: 'patrol' | 'chaser' }[];
  hazards: { position: Vec3; size: Vec3; damageOverTime?: boolean; oneWay?: boolean }[];
  hasBoss: boolean;
  bossPosition?: Vec3;
  goal: { position: Vec3; size: Vec3 };
  music: string;
  requireAllCoins?: boolean;
  checkpoints?: Vec3[];
  movingPlatforms?: { position: Vec3; size: Vec3; path: 'horizontal' | 'vertical' | 'circular'; amount: number; speed: number }[];
  doubleJumpPickups?: Vec3[];
  /** Optional theme for fog/sky: 'forest' | 'dungeon' | default */
  theme?: string;
}

export const TOTAL_LEVELS = 20;

// Per-level music (path relative to base; place files in public/music/ as level1.mp3 … level20.mp3)
export function getLevelMusicPath(levelIndex: number): string {
  return `music/level${(levelIndex % 20) + 1}.mp3`;
}

const GOAL = (x: number, y: number, z: number): { position: Vec3; size: Vec3 } => ({
  position: [x, y, z],
  size: [2, 2, 2],
});

function level(
  name: string,
  spawn: Vec3,
  platforms: PlatformData[],
  coins: CoinDef[],
  enemies: { position: Vec3; patrol?: number; type?: 'patrol' | 'chaser' }[],
  hazards: { position: Vec3; size: Vec3; damageOverTime?: boolean; oneWay?: boolean }[],
  hasBoss: boolean,
  bossPosition: Vec3 | undefined,
  goal: { position: Vec3; size: Vec3 },
  requireAllCoins?: boolean,
  checkpoints?: Vec3[],
  movingPlatforms?: { position: Vec3; size: Vec3; path: 'horizontal' | 'vertical' | 'circular'; amount: number; speed: number }[],
  doubleJumpPickups?: Vec3[],
  theme?: string,
  groundSize?: [number, number]
): LevelData {
  return {
    name,
    spawn,
    groundSize: groundSize ?? [40, 40],
    platforms,
    coins,
    enemies,
    hazards,
    hasBoss,
    bossPosition,
    goal,
    music: getLevelMusicPath(0),
    requireAllCoins: requireAllCoins ?? false,
    checkpoints: checkpoints ?? [],
    movingPlatforms: movingPlatforms ?? [],
    doubleJumpPickups: doubleJumpPickups ?? [],
    theme: theme ?? 'default',
  };
}

// 20 levels with varied layouts
const PLAT = (px: number, py: number, pz: number, sx: number, sy: number, sz: number): PlatformData =>
  [px, py, pz, sx, sy, sz];

export const LEVELS: LevelData[] = [
  level('Level 1', [-26, 1, 0], [PLAT(-26, 0.5, 0, 4, 1, 4), PLAT(-20, 0.5, 2, 2.5, 1, 2.5), PLAT(-14, 1, -1, 2, 1, 2), PLAT(-8, 0.5, 1, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(4, 0.5, 0, 2, 1, 2), PLAT(10, 1, 1, 2, 1, 2), PLAT(16, 0.5, -1, 2.5, 1, 2.5), PLAT(22, 1, 0, 4, 1, 4), PLAT(1, 2, 2, 2, 1, 2), PLAT(-17, 1.5, -2, 2, 1, 2)], [[-22, 1, 1], [-12, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0], { position: [2, 2, 2], value: 25 }], [], [], false, undefined, GOAL(26, 1.5, 0), false, undefined, undefined, undefined, 'forest', [60, 60]),
  level('Level 2', [0, 1, -26], [PLAT(0, 0.5, -26, 4, 1, 4), PLAT(2, 0.5, -20, 2.5, 1, 2.5), PLAT(-1, 1, -14, 2, 1, 2), PLAT(1, 0.5, -8, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(0, 0.5, 4, 2, 1, 2), PLAT(1, 1, 10, 2, 1, 2), PLAT(-1, 0.5, 16, 2.5, 1, 2.5), PLAT(0, 1, 22, 4, 1, 4), PLAT(2, 2, 1, 2, 1, 2), PLAT(-2, 1.5, -17, 2, 1, 2), PLAT(3, 0.5, -11, 2, 1, 2)], [[0, 1, -22], [2, 1.5, -12], [-1, 2, -4], [1, 1, 6], [0, 1.5, 18]], [{ position: [-2, 0.5, -8], patrol: 2 }], [{ position: [18, 0, 0], size: [2, 1, 20], oneWay: true }], false, undefined, GOAL(0, 1.5, 26), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 3', [-28, 1, 0], [PLAT(-28, 0.5, 0, 4, 1, 4), PLAT(-22, 0.5, -2, 2.5, 1, 2.5), PLAT(-16, 1, 1, 2, 1, 2), PLAT(-10, 0.5, -1, 3, 1, 3), PLAT(-4, 1.5, 2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, -1, 2, 1, 2), PLAT(14, 0.5, 1, 2.5, 1, 2.5), PLAT(20, 1, 0, 3, 1, 3), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(-7, 2, -3, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, -1], [-14, 1.5, 1], [-6, 2, -1], [4, 1, 0], [16, 1.5, 1], [24, 1, 0]], [{ position: [0, 0.5, 0], patrol: 1.5 }], [], false, undefined, GOAL(28, 1.5, 0), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 4', [0, 1, -28], [PLAT(0, 0.5, -28, 5, 1, 5), PLAT(-2, 0.5, -22, 2.5, 1, 2.5), PLAT(1, 1, -16, 2, 1, 2), PLAT(-1, 0.5, -10, 3, 1, 3), PLAT(2, 1.5, -4, 2.5, 1, 2.5), PLAT(0, 0.5, 2, 2, 1, 2), PLAT(-1, 1, 8, 2, 1, 2), PLAT(1, 0.5, 14, 2.5, 1, 2.5), PLAT(0, 1, 20, 5, 1, 5), PLAT(3, 2, -7, 2, 1, 2), PLAT(-3, 1.5, 5, 2, 1, 2), PLAT(2, 0.5, 11, 2, 1, 2)], [[0, 1.5, -24], [-1, 1.5, -14], [2, 2, -6], [0, 1, 4], [-1, 1.5, 16], [0, 1.5, 24]], [{ position: [-2, 0.5, -8], patrol: 2 }], [{ position: [20, 0, 0], size: [2, 1, 20] }], true, [0, 1, 0], GOAL(0, 1.5, 28), false, undefined, undefined, undefined, 'dungeon', [60, 60]),
  level('Level 5', [-26, 1, 0], [PLAT(-26, 0.5, 0, 4, 1, 4), PLAT(-20, 0.5, 2, 2.5, 1, 2.5), PLAT(-14, 1, -1, 2, 1, 2), PLAT(-8, 0.5, 1, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(4, 0.5, 0, 2, 1, 2), PLAT(10, 1, 1, 2, 1, 2), PLAT(16, 0.5, -1, 2.5, 1, 2.5), PLAT(22, 1, 0, 4, 1, 4), PLAT(0, 2, -3, 3, 1, 3), PLAT(-17, 1.5, -2, 2, 1, 2), PLAT(7, 2, 2, 2, 1, 2)], [[-22, 1, 1], [-12, 1.5, -1], [0, 2, -3], [6, 1, 1], [18, 1.5, 0]], [{ position: [0, 1, 0], patrol: 2 }, { position: [22, 0.5, 0], patrol: 0 }], [], false, undefined, GOAL(26, 1.5, 0), false, undefined, undefined, [[0, 2.2, -3]], undefined, [60, 60]),
  level('Level 6', [-28, 1, 0], [PLAT(-28, 0.5, 0, 5, 1, 5), PLAT(-22, 0.5, 2, 2.5, 1, 2.5), PLAT(-16, 1, -1, 2, 1, 2), PLAT(-10, 0.5, 1, 3, 1, 3), PLAT(-4, 1.5, -2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, 1, 2, 1, 2), PLAT(14, 0.5, -1, 2.5, 1, 2.5), PLAT(20, 1, 0, 3, 1, 3), PLAT(26, 0.5, 0, 5, 1, 5), PLAT(-7, 2, -2, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, 1], [-14, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0], [24, 1, 0]], [], [{ position: [0, -0.2, 18], size: [60, 0.5, 2], damageOverTime: true }], false, undefined, GOAL(28, 1.5, 0), true, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 7', [-26, 1, 0], [PLAT(-26, 0.5, 0, 4, 1, 4), PLAT(-20, 0.5, 2, 2.5, 1, 2.5), PLAT(-14, 1, -1, 2, 1, 2), PLAT(-8, 0.5, 1, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(4, 0.5, 0, 2, 1, 2), PLAT(10, 1, 1, 2, 1, 2), PLAT(16, 0.5, -1, 2.5, 1, 2.5), PLAT(22, 1, 0, 4, 1, 4), PLAT(0, 1.25, 0, 2.5, 0.5, 2), PLAT(1, 2, 2, 2, 1, 2), PLAT(-17, 1.5, -2, 2, 1, 2)], [[-22, 1, 1], [-12, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0]], [{ position: [0, 0.5, 0], patrol: 2 }], [{ position: [20, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(26, 1.5, 0), false, undefined, [{ position: [0, 1.25, 0], size: [2.5, 0.5, 2], path: 'vertical', amount: 1, speed: 1.2 }], undefined, undefined, [60, 60]),
  level('Level 8', [-26, 1, 0], [PLAT(-26, 0.5, 0, 4, 1, 4), PLAT(-20, 0.5, 2, 2.5, 1, 2.5), PLAT(-14, 1, -1, 2, 1, 2), PLAT(-8, 0.5, 1, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(4, 0.5, 0, 2, 1, 2), PLAT(10, 1, 1, 2, 1, 2), PLAT(16, 0.5, -1, 2.5, 1, 2.5), PLAT(22, 1, 0, 4, 1, 4), PLAT(1, 2, 2, 2, 1, 2), PLAT(-17, 1.5, -2, 2, 1, 2), PLAT(7, 1.5, -2, 2, 1, 2)], [[-22, 1, 1], [-12, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0]], [{ position: [2, 0.5, 2], patrol: 1 }, { position: [-10, 0.5, -1], type: 'chaser' }], [], false, undefined, GOAL(26, 2.5, -4), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 9', [-28, 1, 0], [PLAT(-28, 0.5, 0, 5, 1, 5), PLAT(-22, 0.5, 2, 2.5, 1, 2.5), PLAT(-16, 1, -1, 2, 1, 2), PLAT(-10, 0.5, 1, 3, 1, 3), PLAT(-4, 1.5, -2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, 1, 2, 1, 2), PLAT(14, 0.5, -1, 2.5, 1, 2.5), PLAT(20, 1, 0, 5, 1, 5), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(-7, 2, -2, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, 1], [-14, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0], [24, 1, 0]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], true, [0, 1, 0], GOAL(28, 1.5, 0), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 10', [0, 1, -28], [PLAT(0, 0.5, -28, 5, 1, 5), PLAT(-2, 0.5, -22, 2.5, 1, 2.5), PLAT(1, 1, -16, 2, 1, 2), PLAT(-1, 0.5, -10, 3, 1, 3), PLAT(2, 1.5, -4, 2.5, 1, 2.5), PLAT(0, 0.5, 2, 2, 1, 2), PLAT(-1, 1, 8, 2, 1, 2), PLAT(1, 0.5, 14, 2.5, 1, 2.5), PLAT(0, 1, 20, 5, 1, 5), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(3, 2, -7, 2, 1, 2), PLAT(-3, 1.5, 5, 2, 1, 2)], [[0, 1.5, -24], [-1, 1.5, -14], { position: [2, 2, -6], value: 50 }, [0, 1, 4], [-1, 1.5, 16], [0, 2, -4]], [{ position: [-2, 0.5, -8], patrol: 1.5 }, { position: [2, 0.5, 8], patrol: 1.5 }], [{ position: [0, -0.2, 22], size: [60, 0.5, 2] }], false, undefined, GOAL(0, 2, 28), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 11', [-26, 1, 0], [PLAT(-26, 0.5, 0, 4, 1, 4), PLAT(-20, 0.5, 2, 2.5, 1, 2.5), PLAT(-14, 1, -1, 2, 1, 2), PLAT(-8, 0.5, 1, 3, 1, 3), PLAT(-2, 1.5, -2, 2.5, 1, 2.5), PLAT(4, 0.5, 0, 2, 1, 2), PLAT(10, 1, 1, 2, 1, 2), PLAT(16, 0.5, -1, 2.5, 1, 2.5), PLAT(22, 1, 0, 4, 1, 4), PLAT(1, 2, 2, 2, 1, 2), PLAT(-17, 1.5, -2, 2, 1, 2)], [[-22, 1, 1], [-12, 1.5, -1], [-4, 2, -2], [0, 2, 0], [6, 1, 1], [18, 1.5, 0]], [{ position: [0, 1, 0], patrol: 1 }], [{ position: [20, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(26, 1.5, 0), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 12', [0, 1, -28], [PLAT(0, 0.5, -28, 5, 1, 5), PLAT(-2, 0.5, -22, 2.5, 1, 2.5), PLAT(1, 1, -16, 2, 1, 2), PLAT(-1, 0.5, -10, 3, 1, 3), PLAT(2, 1.5, -4, 2.5, 1, 2.5), PLAT(0, 0.5, 2, 2, 1, 2), PLAT(-1, 1, 8, 2, 1, 2), PLAT(1, 0.5, 14, 2.5, 1, 2.5), PLAT(0, 1, 20, 5, 1, 5), PLAT(0, 2, -14, 2, 1, 2), PLAT(3, 1.5, 5, 2, 1, 2), PLAT(-3, 0.5, 11, 2, 1, 2)], [[0, 1.5, -24], [-1, 1.5, -14], [2, 2, -4], [0, 1, 4], [-1, 1.5, 16], [0, 2.5, -18]], [{ position: [3, 0.5, -8], patrol: 2 }, { position: [-3, 0.5, 8], patrol: 2 }], [], false, undefined, GOAL(0, 2.5, 28), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 13', [-28, 1, 0], [PLAT(-28, 0.5, 0, 4, 1, 4), PLAT(-22, 0.5, -2, 2.5, 1, 2.5), PLAT(-16, 1, 1, 2, 1, 2), PLAT(-10, 0.5, -1, 3, 1, 3), PLAT(-4, 1.5, 2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, -1, 2, 1, 2), PLAT(14, 0.5, 1, 2.5, 1, 2.5), PLAT(20, 1, 0, 4, 1, 4), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(-7, 2, -3, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, -1], [-14, 1.5, 1], [-6, 2, -1], [4, 1, 0], [16, 1.5, 1], [0, 2, 4]], [{ position: [0, 0.5, 0], patrol: 2 }], [{ position: [22, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(28, 2, 4), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 14', [-28, 1, 0], [PLAT(-28, 0.5, 0, 5, 1, 5), PLAT(-22, 0.5, 2, 2.5, 1, 2.5), PLAT(-16, 1, -1, 2, 1, 2), PLAT(-10, 0.5, 1, 3, 1, 3), PLAT(-4, 1.5, -2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, 1, 2, 1, 2), PLAT(14, 0.5, -1, 2.5, 1, 2.5), PLAT(20, 1, 0, 5, 1, 5), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(-7, 2, -2, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, 1], [-14, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0], [24, 1, 0]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], true, [0, 1, 0], GOAL(28, 1.5, 0), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 15', [0, 1, -30], [PLAT(0, 0.5, -30, 5, 1, 5), PLAT(-2, 0.5, -24, 2.5, 1, 2.5), PLAT(1, 1, -18, 2, 1, 2), PLAT(-1, 0.5, -12, 3, 1, 3), PLAT(2, 1.5, -6, 2.5, 1, 2.5), PLAT(0, 0.5, 0, 2, 1, 2), PLAT(-1, 1, 6, 2, 1, 2), PLAT(1, 0.5, 12, 2.5, 1, 2.5), PLAT(0, 1, 18, 5, 1, 5), PLAT(0, 2, -12, 3, 1, 3), PLAT(3, 1.5, 3, 2, 1, 2), PLAT(-3, 0.5, 9, 2, 1, 2)], [[0, 1.5, -26], [-1, 1.5, -16], [2, 2, -6], [0, 1, 2], [-1, 1.5, 12], [0, 2, -18]], [{ position: [2, 0.5, -8], patrol: 1.5 }, { position: [-2, 0.5, 4], patrol: 1.5 }], [{ position: [0, -0.2, 22], size: [60, 0.5, 2] }], false, undefined, GOAL(0, 2, 30), false, [[0, 1.5, -20], [0, 2, -12]], undefined, undefined, undefined, [60, 60]),
  level('Level 16', [-28, 1, 0], [PLAT(-28, 0.5, 0, 4, 1, 4), PLAT(-22, 0.5, 2, 2.5, 1, 2.5), PLAT(-16, 1, -1, 2, 1, 2), PLAT(-10, 0.5, 1, 3, 1, 3), PLAT(-4, 1.5, -2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, 1, 2, 1, 2), PLAT(14, 0.5, -1, 2.5, 1, 2.5), PLAT(20, 1, 0, 4, 1, 4), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(0, 2, 0, 2, 1, 2), PLAT(-17, 1.5, -2, 2, 1, 2)], [[-24, 1, 1], [-14, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 0], [0, 2.5, 0]], [{ position: [2, 0.5, 2], patrol: 1 }, { position: [-10, 0.5, -1], patrol: 1 }], [], false, undefined, GOAL(28, 2.5, 0), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 17', [0, 1, -28], [PLAT(0, 0.5, -28, 5, 1, 5), PLAT(-2, 0.5, -22, 2.5, 1, 2.5), PLAT(1, 1, -16, 2, 1, 2), PLAT(-1, 0.5, -10, 3, 1, 3), PLAT(2, 1.5, -4, 2.5, 1, 2.5), PLAT(0, 0.5, 2, 2, 1, 2), PLAT(-1, 1, 8, 2, 1, 2), PLAT(1, 0.5, 14, 2.5, 1, 2.5), PLAT(0, 1, 20, 5, 1, 5), PLAT(0, 0.5, 26, 4, 1, 4), PLAT(3, 2, -7, 2, 1, 2), PLAT(-3, 1.5, 5, 2, 1, 2)], [[0, 1.5, -24], [-1, 1.5, -14], [2, 2, -4], [0, 1, 4], [-1, 1.5, 16], [0, 1.5, 24]], [{ position: [0, 0.5, 0], patrol: 2 }, { position: [0, 0.5, 20], patrol: 0 }, { position: [-2, 0.5, -16], patrol: 0 }], [{ position: [0, -0.2, 22], size: [60, 0.5, 2] }], false, undefined, GOAL(0, 1.5, 28), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 18', [-28, 1, 0], [PLAT(-28, 0.5, 0, 5, 1, 5), PLAT(-22, 0.5, 2, 2.5, 1, 2.5), PLAT(-16, 1, -1, 2, 1, 2), PLAT(-10, 0.5, 1, 3, 1, 3), PLAT(-4, 1.5, -2, 2.5, 1, 2.5), PLAT(2, 0.5, 0, 2, 1, 2), PLAT(8, 1, 1, 2, 1, 2), PLAT(14, 0.5, -1, 2.5, 1, 2.5), PLAT(20, 1, 0, 5, 1, 5), PLAT(26, 0.5, 0, 4, 1, 4), PLAT(-7, 2, -2, 2, 1, 2), PLAT(11, 1.5, 2, 2, 1, 2)], [[-24, 1, 1], [-14, 1.5, -1], [-4, 2, -2], [6, 1, 1], [18, 1.5, 3], [24, 1, -1]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], false, undefined, GOAL(28, 2, -4), false, undefined, undefined, undefined, undefined, [60, 60]),
  level('Level 19', [-30, 1, 0], [PLAT(-30, 0.5, 0, 5, 1, 5), PLAT(-24, 0.5, 2, 2.5, 1, 2.5), PLAT(-18, 1, -1, 2, 1, 2), PLAT(-12, 0.5, 1, 3, 1, 3), PLAT(-6, 1.5, -2, 2.5, 1, 2.5), PLAT(0, 0.5, 0, 2, 1, 2), PLAT(6, 1, 1, 2, 1, 2), PLAT(12, 0.5, -1, 2.5, 1, 2.5), PLAT(18, 1, 0, 5, 1, 5), PLAT(24, 0.5, 0, 4, 1, 4), PLAT(-9, 2, -2, 2, 1, 2), PLAT(9, 1.5, 2, 2, 1, 2)], [[-26, 1, 1], [-16, 1.5, -1], [-6, 2, -2], [4, 1, 1], [16, 1.5, 0], [22, 1, 0]], [{ position: [0, 0.5, 0], patrol: 2 }], [], true, [0, 1, 0], GOAL(30, 1.5, 0), false, undefined, undefined, undefined, undefined, [70, 70]),
  level('Level 20', [0, 1, -32], [PLAT(0, 0.5, -32, 6, 1, 6), PLAT(-2, 0.5, -26, 2.5, 1, 2.5), PLAT(1, 1, -20, 2, 1, 2), PLAT(-1, 0.5, -14, 3, 1, 3), PLAT(2, 1.5, -8, 2.5, 1, 2.5), PLAT(0, 0.5, -2, 2, 1, 2), PLAT(-1, 1, 4, 2, 1, 2), PLAT(1, 0.5, 10, 2.5, 1, 2.5), PLAT(0, 1, 16, 6, 1, 6), PLAT(0, 0.5, 24, 6, 1, 6), PLAT(0, 1.5, 30, 6, 1, 6), PLAT(3, 2, -11, 2, 1, 2), PLAT(-3, 1.5, 7, 2, 1, 2)], [[0, 1.5, -28], [-1, 1.5, -18], [2, 2, -8], [0, 1, 2], [-1, 1.5, 14], [0, 1.5, 24], [0, 2, 30]], [{ position: [2, 0.5, -14], patrol: 1.5 }, { position: [-2, 0.5, 8], patrol: 1.5 }], [{ position: [0, -0.2, 26], size: [70, 0.5, 2] }], true, [0, 1, 0], GOAL(0, 1.5, 32), false, undefined, undefined, undefined, undefined, [70, 70]),
];

// Assign each level its own music path
LEVELS.forEach((lev, i) => {
  lev.music = getLevelMusicPath(i);
});
