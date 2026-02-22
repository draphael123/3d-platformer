import * as THREE from 'three';
import { createWorld } from './world';
import { Player } from './player';
import { playLevelMusic, stopLevelMusic, playSfx, playSfxWithPitch } from './audio';
import { LEVELS, TOTAL_LEVELS, type LevelData } from './types';
import { Coin, aabbOverlap } from './entities/Coin';
import { Hazard } from './entities/Hazard';
import { Enemy } from './entities/Enemy';
import { Boss } from './entities/Boss';
import { MovingPlatform } from './entities/MovingPlatform';
import { DoubleJumpPickup } from './entities/DoubleJumpPickup';
import type { PlatformCollider } from './world';
import { ParticleSystem, dust, coinCollect, coinCollectBig, sprintDust, fallWind, hazardSizzle, enemyDeath, bossHit, bossDeath } from './juice/Particles';
import { shake as cameraShake, updateCameraShake } from './juice/CameraShake';
import { updatePlayerJuice, resetPlayerJuiceScale } from './juice/PlayerJuice';

const CAMERA_OFFSET = new THREE.Vector3(0, 4, 8);
const CAMERA_LERP = 0.08;
const INVINCIBLE_DURATION = 1.5;
const INITIAL_LIVES = 3;
const BASE_FOV = 75;
const SFX_PATH = '/sfx/';

function createPauseOverlay(onResume: () => void, onRestart: () => void): { show: () => void; hide: () => void; isVisible: () => boolean } {
  const overlay = document.getElementById('pause-overlay');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  if (!overlay || !resumeBtn || !restartBtn) {
    return { show: () => {}, hide: () => {}, isVisible: () => false };
  }
  resumeBtn.onclick = () => onResume();
  restartBtn.onclick = () => onRestart();
  return {
    show: () => { overlay.classList.add('visible'); playSfx(SFX_PATH + 'pause.mp3', 0.3); },
    hide: () => overlay.classList.remove('visible'),
    isVisible: () => overlay.classList.contains('visible'),
  };
}

function updateHUD(
  levelIndex: number,
  score: number,
  lives: number,
  coinsInfo?: { requireAllCoins: boolean; collected: number; total: number }
): void {
  const levelEl = document.getElementById('hud-level');
  const scoreEl = document.getElementById('hud-score');
  const coinsEl = document.getElementById('hud-coins');
  const heartsEl = document.getElementById('hud-hearts');
  if (levelEl) levelEl.textContent = `Level ${levelIndex + 1}`;
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (coinsEl && coinsInfo?.requireAllCoins) {
    coinsEl.style.display = '';
    coinsEl.textContent = `Coins: ${coinsInfo.collected}/${coinsInfo.total}`;
  } else if (coinsEl) {
    coinsEl.style.display = 'none';
  }
  if (heartsEl) {
    heartsEl.innerHTML = '';
    for (let i = 0; i < INITIAL_LIVES; i++) {
      const span = document.createElement('span');
      span.className = 'heart' + (i >= lives ? ' lost' : '');
      span.textContent = '\u2665';
      span.style.color = i >= lives ? '#444' : '#e74c3c';
      heartsEl.appendChild(span);
    }
  }
}

function showScorePopup(text: string): void {
  const el = document.getElementById('score-popup');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('visible');
  el.offsetHeight;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 600);
}

function showLevelIntro(levelIndex: number, levelName: string): void {
  const wrap = document.getElementById('level-intro');
  const card = document.getElementById('level-intro-text');
  if (!wrap || !card) return;
  card.textContent = `Level ${levelIndex + 1} – ${levelName}`;
  wrap.classList.remove('visible');
  wrap.offsetHeight;
  wrap.classList.add('visible');
  setTimeout(() => wrap.classList.remove('visible'), 2000);
}

const STARS_STORAGE_KEY = 'platformer-level-stars';

function getStoredStars(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STARS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredStars(levelIndex: number, stars: number): void {
  const stored = getStoredStars();
  stored[levelIndex] = Math.max(stored[levelIndex] ?? 0, stars);
  try {
    localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* ignore */
  }
}

function showLevelCompleteOverlay(stars: number, onNext: () => void): void {
  const overlay = document.getElementById('level-complete-overlay');
  const starsEl = document.getElementById('level-complete-stars');
  const scoreEl = document.getElementById('level-complete-score');
  const btn = document.getElementById('level-complete-next');
  if (!overlay || !btn) return;
  if (starsEl) starsEl.textContent = '\u2606'.repeat(3);
  if (scoreEl) scoreEl.textContent = '';
  overlay.classList.add('visible');
  playSfx(SFX_PATH + 'level_complete.mp3', 0.5);
  let revealed = 0;
  const revealNext = () => {
    if (revealed < stars && starsEl) {
      starsEl.textContent = '\u2605'.repeat(revealed + 1) + '\u2606'.repeat(3 - revealed - 1);
      playSfx(SFX_PATH + 'coin.mp3', 0.25, 0.9 + revealed * 0.1);
      revealed++;
      if (revealed < stars) setTimeout(revealNext, 280);
    }
  };
  setTimeout(revealNext, 350);
  btn.onclick = () => {
    overlay.classList.remove('visible');
    onNext();
  };
  setTimeout(() => {
    if (overlay.classList.contains('visible')) {
      overlay.classList.remove('visible');
      onNext();
    }
  }, 2800);
}

function showWinOverlay(finalScore: number, onPlayAgain: () => void): void {
  const overlay = document.getElementById('win-overlay');
  const scoreEl = document.getElementById('win-score');
  const btn = document.getElementById('win-play-again');
  if (!overlay || !btn) return;
  if (scoreEl) scoreEl.textContent = `Final score: ${finalScore}`;
  overlay.classList.add('visible');
  btn.onclick = () => {
    overlay.classList.remove('visible');
    onPlayAgain();
  };
}

function showDamageFlash(): void {
  const el = document.getElementById('damage-flash');
  if (!el) return;
  el.classList.remove('visible');
  el.offsetHeight;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 250);
}

function showStompFlash(): void {
  const el = document.getElementById('stomp-flash');
  if (!el) return;
  el.classList.remove('visible');
  el.offsetHeight;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 120);
}

function setTransitionVisible(visible: boolean): void {
  const el = document.getElementById('transition-overlay');
  if (el) el.classList.toggle('visible', visible);
}

async function main(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 60);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.insertBefore(renderer.domElement, container.firstChild);

  const ambient = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(12, 20, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 50;
  dir.shadow.camera.left = -25;
  dir.shadow.camera.right = 25;
  dir.shadow.camera.top = 25;
  dir.shadow.camera.bottom = -25;
  scene.add(dir);

  const player = new Player();
  scene.add(player.mesh);

  const particleSystem = new ParticleSystem();
  scene.add(particleSystem.getObject());

  let currentLevelIndex = 0;
  let score = 0;
  let lives = INITIAL_LIVES;
  let paused = false;
  let invincibleUntil = 0;
  let lastBlinkTime = 0;
  let timeScale = 1;
  let smoothedFov = BASE_FOV;
  let worldGroup: THREE.Group | null = null;
  let goalMesh: THREE.Group | null = null;
  let colliders: PlatformCollider[] = [];
  let coins: Coin[] = [];
  let hazards: Hazard[] = [];
  let enemies: Enemy[] = [];
  let boss: Boss | null = null;
  let movingPlatforms: MovingPlatform[] = [];
  let doubleJumpPickups: DoubleJumpPickup[] = [];
  let levelCompleteTimeout: number | null = null;
  let transitioning = false;
  const respawnPosition = new THREE.Vector3(0, 1, 0);
  let hadDamageThisLevel = false;
  let sprintDustAccum = 0;
  let fallWindAccum = 0;
  let landingFovBump = 0;

  const pauseOverlay = createPauseOverlay(
    () => {
      paused = false;
      pauseOverlay.hide();
    },
    () => {
      paused = false;
      pauseOverlay.hide();
      loadLevel(currentLevelIndex);
    }
  );

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (pauseOverlay.isVisible()) {
        paused = false;
        pauseOverlay.hide();
      } else {
        paused = true;
        pauseOverlay.show();
      }
    }
  });

  function loadLevel(levelIndex: number, useTransition = true): void {
    transitioning = true;
    if (levelCompleteTimeout != null) {
      clearTimeout(levelCompleteTimeout);
      levelCompleteTimeout = null;
    }
    function doLoad(): void {
      if (worldGroup != null) scene.remove(worldGroup);
      coins.forEach((c) => {
        if (!c.collected) scene.remove(c.mesh);
      });
      hazards.forEach((h) => scene.remove(h.mesh));
      enemies.forEach((e) => scene.remove(e.mesh));
      if (boss) {
        scene.remove(boss.mesh);
        boss = null;
      }
      movingPlatforms.forEach((m) => scene.remove(m.mesh));
      movingPlatforms = [];
      doubleJumpPickups.forEach((p) => scene.remove(p.mesh));
      doubleJumpPickups = [];

      const levelData = LEVELS[levelIndex];
      if (!levelData) {
        transitioning = false;
        return;
      }

      hadDamageThisLevel = false;
      if (levelData.theme === 'forest') {
        scene.background = new THREE.Color(0x5a8a5a);
        scene.fog = new THREE.Fog(0x5a8a5a, 20, 60);
      } else if (levelData.theme === 'dungeon') {
        scene.background = new THREE.Color(0x1a1520);
        scene.fog = new THREE.Fog(0x2a2030, 15, 45);
      } else {
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.Fog(0x87ceeb, 20, 60);
      }

      stopLevelMusic();
      const musicUrl = (import.meta.env.BASE_URL || '/') + levelData.music.replace(/^\//, '');
      playLevelMusic(musicUrl);

      createWorld(levelData).then((result) => {
        worldGroup = result.scene;
        goalMesh = result.goalMesh;
        colliders = result.colliders;
        scene.add(worldGroup);

        player.setPosition(levelData.spawn[0], levelData.spawn[1], levelData.spawn[2]);
        player.doubleJumpRemaining = 0;
        respawnPosition.set(levelData.spawn[0], levelData.spawn[1], levelData.spawn[2]);
        invincibleUntil = performance.now() / 1000 + 0.5;
        resetPlayerJuiceScale(player.mesh);

        coins = levelData.coins.map((c) => {
          const pos = Array.isArray(c) ? (c as [number, number, number]) : c.position;
          const val = Array.isArray(c) ? 10 : (c.value ?? 10);
          return new Coin(pos[0], pos[1], pos[2], val);
        });
        coins.forEach((c) => scene.add(c.mesh));

        hazards = levelData.hazards.map((h) => new Hazard(h.position[0], h.position[1], h.position[2], h.size[0], h.size[1], h.size[2], h.damageOverTime ?? false, h.oneWay ?? false));
        hazards.forEach((h) => scene.add(h.mesh));

        enemies = levelData.enemies.map((e) => new Enemy(e.position[0], e.position[1], e.position[2], e.patrol ?? 1, e.type ?? 'patrol'));
        enemies.forEach((e) => scene.add(e.mesh));

        if (levelData.hasBoss && levelData.bossPosition) {
          boss = new Boss(levelData.bossPosition[0], levelData.bossPosition[1], levelData.bossPosition[2]);
          scene.add(boss.mesh);
        } else {
          boss = null;
        }

        movingPlatforms = (levelData.movingPlatforms ?? []).map((mp) => {
          const m = new MovingPlatform(
            mp.position[0],
            mp.position[1],
            mp.position[2],
            mp.size[0],
            mp.size[1],
            mp.size[2],
            mp.path,
            mp.amount,
            mp.speed
          );
          scene.add(m.mesh);
          return m;
        });

        doubleJumpPickups = (levelData.doubleJumpPickups ?? []).map(([x, y, z]) => {
          const p = new DoubleJumpPickup(x, y, z);
          scene.add(p.mesh);
          return p;
        });

        updateHUD(levelIndex, score, lives, levelData.requireAllCoins ? { requireAllCoins: true, collected: 0, total: coins.length } : undefined);
        transitioning = false;
        showLevelIntro(levelIndex, levelData.name);
        if (useTransition) {
          setTimeout(() => setTransitionVisible(false), 300);
        }
      });
    }
    if (useTransition) {
      setTransitionVisible(true);
      setTimeout(doLoad, 300);
    } else {
      doLoad();
    }
  }

  function hurt(): void {
    if ((performance.now() / 1000) < invincibleUntil) return;
    hadDamageThisLevel = true;
    lives--;
    invincibleUntil = performance.now() / 1000 + INVINCIBLE_DURATION;
    cameraShake(0.35, 0.2);
    playSfx(SFX_PATH + 'hurt.mp3', 0.6);
    showDamageFlash();
    const levelData = LEVELS[currentLevelIndex];
    if (levelData) player.setPosition(respawnPosition.x, respawnPosition.y, respawnPosition.z);
    resetPlayerJuiceScale(player.mesh);
    updateHUD(currentLevelIndex, score, lives, levelData?.requireAllCoins ? { requireAllCoins: true, collected: coins.filter((x) => x.collected).length, total: coins.length } : undefined);
    if (lives <= 0) {
      lives = INITIAL_LIVES;
      score = 0;
      loadLevel(0, false);
    }
  }

  function checkGoal(levelData: LevelData): boolean {
    if (levelData.hasBoss && boss && !boss.dead) return false;
    if (levelData.requireAllCoins && !coins.every((c) => c.collected)) return false;
    const g = levelData.goal;
    const h = [g.size[0] / 2, g.size[1] / 2, g.size[2] / 2] as const;
    const gMin = new THREE.Vector3(g.position[0] - h[0], g.position[1] - h[1], g.position[2] - h[2]);
    const gMax = new THREE.Vector3(g.position[0] + h[0], g.position[1] + h[1], g.position[2] + h[2]);
    const box = player.getAABB();
    if (!aabbOverlap(box.min, box.max, gMin, gMax)) return false;
    return true;
  }

  loadLevel(0, false);

  let prevTime = performance.now() / 1000;

  function animate(): void {
    requestAnimationFrame(animate);
    const now = performance.now() / 1000;
    const dt = Math.min(now - prevTime, 0.1);
    prevTime = now;

    if (paused) {
      renderer.render(scene, camera);
      return;
    }

    const levelData = LEVELS[currentLevelIndex];
    if (!levelData) {
      renderer.render(scene, camera);
      return;
    }

    const effectiveDt = dt * timeScale;
    particleSystem.update(effectiveDt);

    player.update(effectiveDt, colliders);

    movingPlatforms.forEach((m) => m.update(effectiveDt));
    const halfSize = new THREE.Vector3(0.4, 0.8, 0.4);
    for (const mp of movingPlatforms) {
      const box = player.getAABB();
      const aabb = mp.getAABB();
      if (
        box.max.x <= aabb.min.x ||
        box.min.x >= aabb.max.x ||
        box.max.y <= aabb.min.y ||
        box.min.y >= aabb.max.y ||
        box.max.z <= aabb.min.z ||
        box.min.z >= aabb.max.z
      )
        continue;
      const overlapX = Math.min(box.max.x - aabb.min.x, aabb.max.x - box.min.x);
      const overlapY = Math.min(box.max.y - aabb.min.y, aabb.max.y - box.min.y);
      const overlapZ = Math.min(box.max.z - aabb.min.z, aabb.max.z - box.min.z);
      const axis = overlapX < overlapY && overlapX < overlapZ ? 'x' : overlapY < overlapZ ? 'y' : 'z';
      const p = player.mesh.position;
      if (axis === 'x') {
        player.velocity.x = 0;
        if (p.x < mp.position.x) p.x = aabb.min.x - halfSize.x;
        else p.x = aabb.max.x + halfSize.x;
      } else if (axis === 'y') {
        player.velocity.y = 0;
        if (p.y < mp.position.y) {
          p.y = aabb.min.y - halfSize.y;
        } else {
          p.y = aabb.max.y + halfSize.y;
          player.velocity.add(mp.velocity);
        }
      } else {
        player.velocity.z = 0;
        if (p.z < mp.position.z) p.z = aabb.min.z - halfSize.z;
        else p.z = aabb.max.z + halfSize.z;
      }
    }

    const nowSec = performance.now() / 1000;
    if (nowSec < invincibleUntil) {
      if (nowSec - lastBlinkTime >= 0.1) {
        player.mesh.visible = !player.mesh.visible;
        lastBlinkTime = nowSec;
      }
    } else {
      player.mesh.visible = true;
    }
    updatePlayerJuice(player.mesh, player.justLanded, player.justJumped, effectiveDt);
    if (player.justLanded) {
      dust(particleSystem, player.mesh.position.clone());
      cameraShake(0.15, 0.08);
      landingFovBump = -4;
      playSfxWithPitch(SFX_PATH + 'land.mp3', 0.4);
    }
    if (player.justJumped) playSfxWithPitch(SFX_PATH + 'jump.mp3', 0.4);

    const speedXZ = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
    if (player.onGround && player.sprinting && speedXZ > 5) {
      sprintDustAccum += effectiveDt;
      if (sprintDustAccum >= 0.08) {
        sprintDustAccum = 0;
        sprintDust(particleSystem, player.mesh.position.clone());
      }
    } else {
      sprintDustAccum = 0;
    }
    if (player.velocity.y < -15) {
      fallWindAccum += effectiveDt;
      if (fallWindAccum >= 0.06) {
        fallWindAccum = 0;
        fallWind(particleSystem, player.mesh.position.clone());
      }
    } else {
      fallWindAccum = 0;
    }

    hazards.forEach((h) => {
      if (h.damageOverTime && Math.random() < 0.15) {
        const center = h.position.clone().add(new THREE.Vector3(0, h.size.y * 0.5, 0));
        hazardSizzle(particleSystem, center);
      }
    });

    enemies.forEach((e) => e.update(effectiveDt, colliders, player.mesh.position));
    if (boss && !boss.dead) boss.update(effectiveDt, colliders, player.mesh.position);

    coins.forEach((c) => {
      c.animate(effectiveDt);
      if (c.collected) return;
      const box = c.getAABB();
      const pbox = player.getAABB();
      if (aabbOverlap(pbox.min, pbox.max, box.min, box.max)) {
        c.collected = true;
        if (c.value >= 25) coinCollectBig(particleSystem, c.mesh.position.clone());
        else coinCollect(particleSystem, c.mesh.position.clone());
        showScorePopup(`+${c.value}`);
        playSfxWithPitch(SFX_PATH + 'coin.mp3', 0.5);
        scene.remove(c.mesh);
        score += c.value;
        updateHUD(currentLevelIndex, score, lives, levelData.requireAllCoins ? { requireAllCoins: true, collected: coins.filter((x) => x.collected).length, total: coins.length } : undefined);
      }
    });

    doubleJumpPickups.forEach((p) => {
      p.animate(effectiveDt);
      if (p.collected) return;
      const box = p.getAABB();
      const pbox = player.getAABB();
      if (aabbOverlap(pbox.min, pbox.max, box.min, box.max)) {
        p.collected = true;
        scene.remove(p.mesh);
        player.doubleJumpRemaining = 1;
        showScorePopup('Double Jump!');
        playSfxWithPitch(SFX_PATH + 'coin.mp3', 0.4);
      }
    });

    const cpHalf = 1;
    if (levelData.checkpoints?.length) {
      const pbox = player.getAABB();
      for (const cp of levelData.checkpoints) {
        const cMin = new THREE.Vector3(cp[0] - cpHalf, cp[1] - cpHalf, cp[2] - cpHalf);
        const cMax = new THREE.Vector3(cp[0] + cpHalf, cp[1] + cpHalf, cp[2] + cpHalf);
        if (aabbOverlap(pbox.min, pbox.max, cMin, cMax)) {
          const wasDifferent = respawnPosition.x !== cp[0] || respawnPosition.y !== cp[1] || respawnPosition.z !== cp[2];
          respawnPosition.set(cp[0], cp[1], cp[2]);
          if (wasDifferent) {
            showScorePopup('Checkpoint!');
            playSfx(SFX_PATH + 'coin.mp3', 0.25);
          }
          break;
        }
      }
    }

    hazards.forEach((h) => {
      h.update(effectiveDt);
      const box = h.getAABB();
      const pbox = player.getAABB();
      if (!aabbOverlap(pbox.min, pbox.max, box.min, box.max)) return;
      if (h.oneWay) {
        const playerBottom = player.mesh.position.y - 0.8;
        const hazardTop = box.max.y;
        const landingFromAbove = player.velocity.y <= 0 && playerBottom <= hazardTop + 0.2 && playerBottom >= hazardTop - 0.3;
        if (!landingFromAbove) return;
      }
      if (h.damageOverTime) {
        if (nowSec - h.lastHurtTime < 0.5) return;
        h.lastHurtTime = nowSec;
      }
      hurt();
    });

    enemies.forEach((e) => {
      if (e.dead) return;
      const box = e.getAABB();
      const pbox = player.getAABB();
      if (!aabbOverlap(pbox.min, pbox.max, box.min, box.max)) return;
      const stomp = player.mesh.position.y - 0.8 > e.position.y + 0.3 && player.velocity.y <= 0;
      if (stomp) {
        e.dead = true;
        e.mesh.visible = false;
        player.velocity.y = 12;
        enemyDeath(particleSystem, e.position.clone());
        cameraShake(0.25, 0.12);
        showStompFlash();
        playSfxWithPitch(SFX_PATH + 'stomp.mp3', 0.5);
        timeScale = 0.5;
        const stompScore = e.type === 'chaser' ? 30 : 20;
        score += stompScore;
        updateHUD(currentLevelIndex, score, lives, levelData.requireAllCoins ? { requireAllCoins: true, collected: coins.filter((x) => x.collected).length, total: coins.length } : undefined);
        showScorePopup(`STOMP! +${stompScore}`);
      } else hurt();
    });

    if (boss && !boss.dead) {
      const box = boss.getAABB();
      const pbox = player.getAABB();
      if (aabbOverlap(pbox.min, pbox.max, box.min, box.max)) {
        const stomp = player.mesh.position.y - 0.8 > boss.position.y + 0.5 && player.velocity.y <= 0;
        if (stomp) {
          boss.health--;
          player.velocity.y = 8;
          bossHit(particleSystem, boss.position.clone());
          cameraShake(0.2, 0.1);
          showStompFlash();
          playSfxWithPitch(SFX_PATH + 'boss_hit.mp3', 0.55);
          boss.flashHit(nowSec + 0.15);
          timeScale = 0.35;
          if (boss.health <= 0) {
            bossDeath(particleSystem, boss.position.clone());
            boss.dead = true;
            scene.remove(boss.mesh);
            boss = null;
            cameraShake(0.4, 0.2);
            playSfxWithPitch(SFX_PATH + 'boss_death.mp3', 0.6);
            timeScale = 0.4;
            score += 100;
            updateHUD(currentLevelIndex, score, lives, levelData.requireAllCoins ? { requireAllCoins: true, collected: coins.filter((x) => x.collected).length, total: coins.length } : undefined);
            showScorePopup('+100');
          }
        } else hurt();
      }
    }

    if (player.mesh.position.y < -10) hurt();

    if (!transitioning && checkGoal(levelData)) {
      transitioning = true;
      timeScale = 0.5;
      cameraShake(0.2, 0.15);
      playSfxWithPitch(SFX_PATH + 'goal.mp3', 0.5);
      if (currentLevelIndex + 1 >= TOTAL_LEVELS) {
        const allCoins = coins.every((c) => c.collected);
        const stars = Math.min(3, 1 + (allCoins ? 1 : 0) + (!hadDamageThisLevel ? 1 : 0));
        setStoredStars(currentLevelIndex, stars);
        updateHUD(currentLevelIndex, score, lives, levelData.requireAllCoins ? { requireAllCoins: true, collected: coins.filter((x) => x.collected).length, total: coins.length } : undefined);
        showWinOverlay(score, () => {
          currentLevelIndex = 0;
          score = 0;
          lives = INITIAL_LIVES;
          loadLevel(0, false);
        });
      } else {
        const allCoins = coins.every((c) => c.collected);
        const stars = Math.min(3, 1 + (allCoins ? 1 : 0) + (!hadDamageThisLevel ? 1 : 0));
        setStoredStars(currentLevelIndex, stars);
        currentLevelIndex++;
        showLevelCompleteOverlay(stars, () => loadLevel(currentLevelIndex));
      }
    }

    timeScale = Math.min(1, timeScale + dt * 5);
    if (goalMesh) goalMesh.rotation.y += effectiveDt * 1.2;
    landingFovBump *= Math.max(0, 1 - dt * 25);
    const shakeOffset = updateCameraShake(dt);
    const speedFactor = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2) / 8;
    const bob = speedFactor * 0.06 * Math.sin(prevTime * 12);
    const targetCamPos = player.mesh.position.clone().add(CAMERA_OFFSET).add(shakeOffset);
    targetCamPos.y += bob;
    targetCamPos.x += bob * 0.3;
    camera.position.lerp(targetCamPos, CAMERA_LERP);
    const lookAt = player.mesh.position.clone();
    lookAt.y += 0.8;
    camera.lookAt(lookAt);
    const movementTilt = (player.velocity.x / 8) * -0.025;
    camera.rotation.z = movementTilt;
    smoothedFov = smoothedFov + (BASE_FOV + (player.onGround ? 0 : 3) + speedFactor * 4 + landingFovBump - smoothedFov) * dt * 6;
    camera.fov = smoothedFov;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

main();
