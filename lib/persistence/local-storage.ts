import type { WorldState } from '@/lib/schema';

const KEY = 'pax-motorsport-career';

export function saveCareerToStorage(state: WorldState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadCareerFromStorage(): WorldState | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as WorldState;
}
