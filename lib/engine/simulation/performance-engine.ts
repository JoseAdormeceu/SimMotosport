import { clamp } from '../utils/clamps';
import { createSeededRng } from '../utils/random';

export interface PerformanceInput {
  seed: number;
  skill: number;
  consistency: number;
  pressureHandling: number;
  teamStrength: number;
  weatherVolatility: number;
  morale: number;
}

export interface PerformanceResult {
  qualifyingScore: number;
  raceScore: number;
  mistakeChance: number;
  overperformance: boolean;
  underperformance: boolean;
  notes: string[];
}

export function simulatePerformance(input: PerformanceInput): PerformanceResult {
  const rng = createSeededRng(input.seed);
  const base = input.skill * 0.4 + input.teamStrength * 0.3 + input.morale * 0.1 + input.consistency * 0.2;
  const variance = (rng.next() - 0.5) * (20 + input.weatherVolatility * 0.2);
  const qualifyingScore = clamp(base + variance, 0, 100);
  const raceConsistencyFactor = (input.consistency + input.pressureHandling) / 2;
  const raceVariance = (rng.next() - 0.5) * (16 + input.weatherVolatility * 0.25);
  const raceScore = clamp(base * 0.9 + raceConsistencyFactor * 0.1 + raceVariance, 0, 100);

  const mistakeChance = clamp(
    35 - input.consistency * 0.2 - input.pressureHandling * 0.15 + input.weatherVolatility * 0.15,
    1,
    60,
  );

  const expected = input.skill * 0.65 + input.teamStrength * 0.35;
  const combined = (qualifyingScore + raceScore) / 2;
  const delta = combined - expected;

  const overperformance = delta > 7;
  const underperformance = delta < -7;
  const notes: string[] = [];

  if (overperformance) notes.push('heroic execution in difficult conditions');
  if (underperformance) notes.push('weekend lacked expected sharpness');
  if (!overperformance && !underperformance) notes.push('clinical and composed weekend');
  if (mistakeChance > 30) notes.push('error pressure remained elevated');

  return {
    qualifyingScore,
    raceScore,
    mistakeChance,
    overperformance,
    underperformance,
    notes,
  };
}
