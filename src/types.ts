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

// Per-level music paths (place in public/music/ or use placeholders)
const MUSIC_BASE = '/music/level';
export function getLevelMusicPath(levelIndex: number): string {
  return `${MUSIC_BASE}${(levelIndex % 20) + 1}.mp3`;
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
  theme?: string
): LevelData {
  return {
    name,
    spawn,
    groundSize: [40, 40],
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
  level('Level 1', [0, 1, 5], [PLAT(3, 0.5, 0, 3, 1, 3), PLAT(-4, 0.5, 5, 2.5, 1, 2.5), PLAT(5, 0.5, -4, 2, 1, 2), PLAT(-2, 1.5, -3, 2, 1, 2), PLAT(0, 2, 4, 2.5, 1, 2.5)], [[0, 1.5, 2], { position: [4, 1.5, -2], value: 25 }], [], [], false, undefined, GOAL(0, 2.5, 5), false, undefined, undefined, undefined, 'forest'),
  level('Level 2', [0, 1, 5], [PLAT(2, 0.5, 2, 2, 1, 2), PLAT(-3, 0.5, -2, 2.5, 1, 2.5), PLAT(4, 1, 0, 2, 1, 2), PLAT(-1, 1.5, 3, 2, 1, 2)], [[2, 1, 2], [-3, 1, -2], [4, 1.5, 0]], [{ position: [-2, 0.5, 0], patrol: 2 }], [{ position: [6, 0, 0], size: [2, 1, 20], oneWay: true }], false, undefined, GOAL(-1, 2, 3)),
  level('Level 3', [-5, 1, 5], [PLAT(0, 0.5, 0, 4, 1, 4), PLAT(5, 1, 3, 2, 1, 2), PLAT(-4, 1, -3, 2, 1, 2)], [[0, 1.5, 0], [5, 1.5, 3]], [{ position: [2, 0.5, 0], patrol: 1.5 }], [], false, undefined, GOAL(5, 1.5, 3)),
  level('Level 4', [0, 1, 8], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(4, 1, 5, 2, 1, 2), PLAT(-4, 1, -4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 5], [-4, 1.5, -4]], [{ position: [2, 0.5, 2], patrol: 2 }], [{ position: [8, 0, 0], size: [2, 1, 20] }], true, [0, 1, 0], GOAL(0, 1.5, 0), false, undefined, undefined, undefined, 'dungeon'),
  level('Level 5', [0, 1, 5], [PLAT(3, 0.5, 0, 2, 1, 2), PLAT(-3, 0.5, 4, 2, 1, 2), PLAT(0, 1.5, -3, 3, 1, 3), PLAT(5, 0.5, 5, 2, 1, 2)], [[3, 1, 0], [-3, 1, 4], [0, 2, -3]], [{ position: [0, 1, 0], patrol: 2 }, { position: [5, 0.5, 5], patrol: 0 }], [], false, undefined, GOAL(5, 1, 5), false, undefined, undefined, [[0, 2.2, -3]]),
  level('Level 6', [0, 1, 5], [PLAT(0, 0.5, 0, 5, 1, 5), PLAT(6, 1, 0, 2, 1, 2), PLAT(-6, 1, 0, 2, 1, 2)], [[0, 1.5, 0], [6, 1.5, 0], [-6, 1.5, 0]], [], [{ position: [0, -0.2, 7], size: [20, 0.5, 2], damageOverTime: true }], false, undefined, GOAL(6, 1.5, 0), true),
  level('Level 7', [-4, 1, 4], [PLAT(-2, 0.5, 0, 3, 1, 3), PLAT(2, 1, 2, 2, 1, 2), PLAT(2, 1.5, -3, 2, 1, 2), PLAT(-3, 0.5, -4, 2, 1, 2)], [[-2, 1, 0], [2, 1.5, 2], [2, 2, -3]], [{ position: [0, 0.5, 0], patrol: 2 }], [{ position: [5, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(2, 2, -3), false, undefined, [{ position: [0, 1.25, 0], size: [2.5, 0.5, 2], path: 'vertical', amount: 1, speed: 1.2 }]),
  level('Level 8', [0, 1, 6], [PLAT(0, 0.5, 0, 4, 1, 4), PLAT(4, 1, 4, 2, 1, 2), PLAT(-4, 1, -2, 2, 1, 2), PLAT(0, 2, -4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 4], [-4, 1.5, -2]], [{ position: [2, 0.5, 2], patrol: 1 }, { position: [-2, 0.5, -1], type: 'chaser' }], [], false, undefined, GOAL(0, 2.5, -4)),
  level('Level 9', [0, 1, 5], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(5, 1, 4, 2, 1, 2), PLAT(-5, 1, -3, 2, 1, 2)], [[0, 1.5, 0], [5, 1.5, 4], [-5, 1.5, -3]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], true, [0, 1, 0], GOAL(0, 1.5, 0)),
  level('Level 10', [0, 1, 8], [PLAT(0, 0.5, 0, 5, 1, 5), PLAT(4, 1, 4, 2, 1, 2), PLAT(-4, 1, 3, 2, 1, 2), PLAT(0, 1.5, -4, 3, 1, 3)], [[0, 1.5, 0], [4, 1.5, 4], { position: [-4, 1.5, 3], value: 50 }, [0, 2, -4]], [{ position: [2, 0.5, 2], patrol: 1.5 }, { position: [-2, 0.5, 3], patrol: 1.5 }], [{ position: [0, -0.2, 9], size: [20, 0.5, 2] }], false, undefined, GOAL(0, 2, -4)),
  level('Level 11', [0, 1, 5], [PLAT(2, 0.5, 2, 2, 1, 2), PLAT(-2, 0.5, -2, 2, 1, 2), PLAT(0, 1.5, 0, 2, 1, 2), PLAT(5, 1, 0, 2, 1, 2)], [[2, 1, 2], [-2, 1, -2], [0, 2, 0], [5, 1.5, 0]], [{ position: [0, 1, 0], patrol: 1 }], [{ position: [7, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(5, 1.5, 0)),
  level('Level 12', [0, 1, 6], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(5, 1, 4, 2, 1, 2), PLAT(-5, 1, -4, 2, 1, 2), PLAT(0, 2, -5, 2, 1, 2)], [[0, 1.5, 0], [5, 1.5, 4], [-5, 1.5, -4], [0, 2.5, -5]], [{ position: [3, 0.5, 2], patrol: 2 }, { position: [-3, 0.5, -2], patrol: 2 }], [], false, undefined, GOAL(0, 2.5, -5)),
  level('Level 13', [-5, 1, 0], [PLAT(0, 0.5, 0, 4, 1, 4), PLAT(4, 1, 2, 2, 1, 2), PLAT(-3, 1, -3, 2, 1, 2), PLAT(0, 1.5, 4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 2], [-3, 1.5, -3], [0, 2, 4]], [{ position: [0, 0.5, 0], patrol: 2 }], [{ position: [6, 0, 0], size: [2, 1, 20] }], false, undefined, GOAL(0, 2, 4)),
  level('Level 14', [0, 1, 5], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(4, 1, 4, 2, 1, 2), PLAT(-4, 1, -4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 4], [-4, 1.5, -4]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], true, [0, 1, 0], GOAL(0, 1.5, 0)),
  level('Level 15', [0, 1, 7], [PLAT(0, 0.5, 0, 5, 1, 5), PLAT(5, 1, 3, 2, 1, 2), PLAT(-5, 1, -2, 2, 1, 2), PLAT(0, 1.5, -5, 3, 1, 3)], [[0, 1.5, 0], [5, 1.5, 3], [-5, 1.5, -2], [0, 2, -5]], [{ position: [2, 0.5, 1], patrol: 1.5 }, { position: [-2, 0.5, -1], patrol: 1.5 }], [{ position: [0, -0.2, 8], size: [20, 0.5, 2] }], false, undefined, GOAL(0, 2, -5), false, [[0, 1.5, 0], [0, 2, -5]]),
  level('Level 16', [0, 1, 5], [PLAT(0, 0.5, 0, 4, 1, 4), PLAT(4, 1, 2, 2, 1, 2), PLAT(-4, 1, -2, 2, 1, 2), PLAT(0, 2, 0, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 2], [-4, 1.5, -2], [0, 2.5, 0]], [{ position: [2, 0.5, 1], patrol: 1 }, { position: [-2, 0.5, -1], patrol: 1 }], [], false, undefined, GOAL(0, 2.5, 0)),
  level('Level 17', [0, 1, 6], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(5, 1, 4, 2, 1, 2), PLAT(-5, 1, -4, 2, 1, 2)], [[0, 1.5, 0], [5, 1.5, 4], [-5, 1.5, -4]], [{ position: [0, 0.5, 0], patrol: 2 }, { position: [5, 0.5, 4], patrol: 0 }, { position: [-5, 0.5, -4], patrol: 0 }], [{ position: [0, -0.2, 7], size: [20, 0.5, 2] }], false, undefined, GOAL(5, 1.5, 4)),
  level('Level 18', [0, 1, 5], [PLAT(0, 0.5, 0, 5, 1, 5), PLAT(4, 1, 3, 2, 1, 2), PLAT(-4, 1, -3, 2, 1, 2), PLAT(0, 1.5, -4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 3], [-4, 1.5, -3], [0, 2, -4]], [{ position: [0, 0.5, 0], patrol: 2.5 }], [], false, undefined, GOAL(0, 2, -4)),
  level('Level 19', [0, 1, 5], [PLAT(0, 0.5, 0, 6, 1, 6), PLAT(4, 1, 4, 2, 1, 2), PLAT(-4, 1, -4, 2, 1, 2)], [[0, 1.5, 0], [4, 1.5, 4], [-4, 1.5, -4]], [{ position: [0, 0.5, 0], patrol: 2 }], [], true, [0, 1, 0], GOAL(0, 1.5, 0)),
  level('Level 20', [0, 1, 8], [PLAT(0, 0.5, 0, 8, 1, 8), PLAT(5, 1, 5, 2, 1, 2), PLAT(-5, 1, -5, 2, 1, 2)], [[0, 1.5, 0], [5, 1.5, 5], [-5, 1.5, -5]], [{ position: [2, 0.5, 2], patrol: 1.5 }, { position: [-2, 0.5, -2], patrol: 1.5 }], [{ position: [0, -0.2, 10], size: [25, 0.5, 2] }], true, [0, 1, 0], GOAL(0, 1.5, 0)),
];

// Assign each level its own music path
LEVELS.forEach((lev, i) => {
  lev.music = getLevelMusicPath(i);
});
