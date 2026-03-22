export interface SeededRng {
  next: () => number;
}

export function createSeededRng(seed: number): SeededRng {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return {
    next: () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    },
  };
}
