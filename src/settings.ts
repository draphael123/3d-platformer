const REDUCED_MOTION_KEY = 'platformer-reduced-motion';

export function getReducedMotion(): boolean {
  try {
    return localStorage.getItem(REDUCED_MOTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setReducedMotion(value: boolean): void {
  try {
    localStorage.setItem(REDUCED_MOTION_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}
