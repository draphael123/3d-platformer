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

export function playSfx(path: string, volume = 0.6, pitchVariation = 1): void {
  const pool = getSfxPool();
  const el = pool[sfxIndex % pool.length];
  sfxIndex++;
  el.volume = volume;
  el.playbackRate = pitchVariation;
  el.src = path;
  el.play().catch(() => {});
}

/** Play with random pitch in [min, max] for variety (e.g. 0.92, 1.08) */
export function playSfxWithPitch(path: string, volume = 0.6, minPitch = 0.92, maxPitch = 1.08): void {
  const pitch = minPitch + Math.random() * (maxPitch - minPitch);
  playSfx(path, volume, pitch);
}
