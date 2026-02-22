const MUSIC_VOLUME_KEY = 'platformer-music-volume';

let currentAudio: HTMLAudioElement | null = null;
let musicVolume = (() => {
  try {
    const v = parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) ?? '0.5');
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0.5));
  } catch {
    return 0.5;
  }
})();

export function getMusicVolume(): number {
  return musicVolume;
}

export function playLevelMusic(musicPath: string, loop = true): void {
  stopLevelMusic();
  const audio = new Audio(musicPath);
  currentAudio = audio;
  audio.loop = loop;
  audio.volume = musicVolume;
  audio.play().catch(() => {
    // Autoplay or file not found - ignore
  });
}

export function stopLevelMusic(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export function setMusicVolume(vol: number): void {
  musicVolume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  } catch {
    /* ignore */
  }
  if (currentAudio) currentAudio.volume = musicVolume;
}

const SFX_VOLUME_KEY = 'platformer-sfx-volume';
let sfxVolume = (() => {
  try {
    const v = parseFloat(localStorage.getItem(SFX_VOLUME_KEY) ?? '0.7');
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0.7));
  } catch {
    return 0.7;
  }
})();

export function getSfxVolume(): number {
  return sfxVolume;
}

export function setSfxVolume(vol: number): void {
  sfxVolume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem(SFX_VOLUME_KEY, String(sfxVolume));
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (audioCtx == null) {
    try {
      audioCtx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  pitchMult = 1,
  decay = true
): void {
  const ctx = getCtx();
  if (!ctx || sfxVolume <= 0) return;
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume * sfxVolume, now);
  if (decay) gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
  gainNode.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * pitchMult, now);
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + duration);
}

function noise(duration: number, volume: number): void {
  const ctx = getCtx();
  if (!ctx || sfxVolume <= 0) return;
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * duration * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * volume * sfxVolume;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + duration);
}

export type SfxEvent =
  | 'jump'
  | 'land'
  | 'coin'
  | 'hurt'
  | 'stomp'
  | 'goal'
  | 'levelComplete'
  | 'pause'
  | 'bossHit'
  | 'bossDeath'
  | 'powerUp'
  | 'checkpoint'
  | 'click';

/** Play a procedural sound effect. Optional pitchMult for variation (e.g. 0.95–1.05). */
export function playSfxEvent(event: SfxEvent, pitchMult = 1): void {
  const p = pitchMult;
  switch (event) {
    case 'jump':
      tone(320, 0.08, 'sine', 0.35, p, true);
      tone(480, 0.1, 'sine', 0.2, p * 1.2, true);
      break;
    case 'land':
      tone(80, 0.06, 'sine', 0.4, p, true);
      noise(0.04, 0.15);
      break;
    case 'coin':
      tone(880, 0.05, 'sine', 0.4, p, true);
      tone(1320, 0.07, 'sine', 0.25, p * 1.1, true);
      break;
    case 'hurt':
      tone(120, 0.2, 'sawtooth', 0.4, p * 0.9, true);
      noise(0.15, 0.2);
      break;
    case 'stomp':
      tone(100, 0.08, 'sine', 0.5, p, true);
      noise(0.06, 0.25);
      break;
    case 'goal':
      tone(523, 0.12, 'sine', 0.4, p, true);
      tone(659, 0.14, 'sine', 0.35, p, true);
      tone(784, 0.2, 'sine', 0.3, p, true);
      break;
    case 'levelComplete':
      tone(523, 0.15, 'sine', 0.4, p, true);
      tone(659, 0.15, 'sine', 0.35, p, true);
      tone(784, 0.2, 'sine', 0.35, p, true);
      break;
    case 'pause':
      tone(400, 0.04, 'sine', 0.25, p, true);
      break;
    case 'bossHit':
      tone(90, 0.1, 'sine', 0.5, p, true);
      noise(0.08, 0.2);
      break;
    case 'bossDeath':
      tone(60, 0.2, 'sine', 0.5, p * 0.8, true);
      noise(0.15, 0.35);
      break;
    case 'powerUp':
      tone(440, 0.08, 'sine', 0.35, p, true);
      tone(660, 0.1, 'sine', 0.3, p, true);
      tone(880, 0.12, 'sine', 0.25, p, true);
      break;
    case 'checkpoint':
      tone(392, 0.06, 'sine', 0.3, p, true);
      tone(523, 0.08, 'sine', 0.2, p * 1.05, true);
      break;
    case 'click':
      tone(600, 0.03, 'sine', 0.2, p, true);
      break;
    default:
      break;
  }
}

const SFX_POOL_SIZE = 10;
const sfxPool: HTMLAudioElement[] = [];
let sfxIndex = 0;

function getSfxPool(): HTMLAudioElement[] {
  if (sfxPool.length === 0) {
    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      sfxPool.push(new Audio());
    }
  }
  return sfxPool;
}

/** Play from file path (optional; use playSfxEvent for built-in procedural sounds). */
export function playSfx(path: string, volume = 0.6, pitchVariation = 1): void {
  const pool = getSfxPool();
  const el = pool[sfxIndex % pool.length];
  sfxIndex++;
  el.volume = volume * sfxVolume;
  el.playbackRate = pitchVariation;
  el.src = path;
  el.play().catch(() => {});
}

/** Play file with random pitch; falls back to no-op if file missing. */
export function playSfxWithPitch(path: string, volume = 0.6, minPitch = 0.92, maxPitch = 1.08): void {
  const pitch = minPitch + Math.random() * (maxPitch - minPitch);
  playSfx(path, volume, pitch);
}
