const PROGRESS_KEY = 'platformer-progress';
const DEFAULT: Progress = { highestUnlockedLevel: 0, bestScore: 0 };

export interface Progress {
  highestUnlockedLevel: number;
  bestScore: number;
}

export function getProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      highestUnlockedLevel: Math.max(0, Math.min(19, Number(p.highestUnlockedLevel) || 0)),
      bestScore: Math.max(0, Number(p.bestScore) || 0),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProgress(updates: Partial<Progress>): void {
  try {
    const current = getProgress();
    const next: Progress = {
      highestUnlockedLevel: Math.max(current.highestUnlockedLevel, updates.highestUnlockedLevel ?? current.highestUnlockedLevel),
      bestScore: Math.max(current.bestScore, updates.bestScore ?? current.bestScore),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function unlockLevel(levelIndex: number): void {
  if (levelIndex < 0) return;
  const p = getProgress();
  if (levelIndex >= p.highestUnlockedLevel) {
    saveProgress({ highestUnlockedLevel: levelIndex + 1 });
  }
}

export function updateBestScore(score: number): void {
  const p = getProgress();
  if (score > p.bestScore) saveProgress({ bestScore: score });
}
