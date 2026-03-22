import type { SeededRng } from './random';

export function weightedChoice<T>(items: Array<{ item: T; weight: number }>, rng: SeededRng): T {
  const total = items.reduce((acc, entry) => acc + entry.weight, 0);
  const roll = rng.next() * total;
  let cursor = 0;
  for (const entry of items) {
    cursor += entry.weight;
    if (roll <= cursor) return entry.item;
  }
  return items[items.length - 1].item;
}
