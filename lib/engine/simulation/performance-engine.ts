import { clamp } from '../utils/clamps';
import { createSeededRng } from '../utils/random';

export interface PerformanceInput {
  seed: number;
  rawPace: number;
  qualifyingPace: number;
  racePace: number;
  consistency: number;
  pressureHandling: number;
  teamStrength: number;
  weatherVolatility: number;
  morale: number;
  confidence: number;
}

export interface SessionResult {
  score: number;
  expectedDelta: number;
  mistakeRisk: number;
}

export interface PerformanceResult {
  qualifying: SessionResult;
  race: SessionResult;
  overperformance: boolean;
  underperformance: boolean;
  notes: string[];
}

function makeScore(base: number, swing: number): number {
  return clamp(base + swing, 0, 100);
}

export function simulateQualifying(input: PerformanceInput): SessionResult {
  const rng = createSeededRng(input.seed * 17 + 3);
  const base =
    input.rawPace * 0.25 +
    input.qualifyingPace * 0.35 +
    input.teamStrength * 0.25 +
    input.confidence * 0.1 +
    input.morale * 0.05;
  const swing = (rng.next() - 0.5) * (12 + input.weatherVolatility * 0.22);
  const score = makeScore(base, swing);
  const expected = input.rawPace * 0.45 + input.teamStrength * 0.55;

  return {
    score,
    expectedDelta: score - expected,
    mistakeRisk: clamp(28 - input.consistency * 0.12 - input.pressureHandling * 0.08, 3, 45),
  };
}

export function simulateRace(input: PerformanceInput): SessionResult {
  const rng = createSeededRng(input.seed * 17 + 11);
  const base =
    input.rawPace * 0.2 +
    input.racePace * 0.35 +
    input.consistency * 0.2 +
    input.teamStrength * 0.2 +
    input.pressureHandling * 0.05;
  const swing = (rng.next() - 0.5) * (14 + input.weatherVolatility * 0.28);
  const score = makeScore(base, swing);
  const expected = input.racePace * 0.5 + input.teamStrength * 0.5;

  return {
    score,
    expectedDelta: score - expected,
    mistakeRisk: clamp(34 - input.consistency * 0.2 - input.pressureHandling * 0.12 + input.weatherVolatility * 0.09, 5, 60),
  };
}

export function simulatePerformance(input: PerformanceInput): PerformanceResult {
  const qualifying = simulateQualifying(input);
  const race = simulateRace(input);
  const combinedDelta = (qualifying.expectedDelta + race.expectedDelta) / 2;

  const notes: string[] = [];
  if (combinedDelta > 8) notes.push('outperformed machinery across the weekend');
  if (combinedDelta < -8) notes.push('underperformed versus car potential');
  if (!notes.length) notes.push('delivered close to baseline expectation');
  if (race.mistakeRisk >= 30) notes.push('high race volatility increased incident risk');

  return {
    qualifying,
    race,
    overperformance: combinedDelta > 8,
    underperformance: combinedDelta < -8,
    notes,
  };
}

export function scoreToGridPosition(score: number): number {
  return clamp(Math.round(22 - score / 5), 1, 20);
}

export function raceScoreToFinish(score: number, qualifyingPosition: number): number {
  const pacePosition = scoreToGridPosition(score);
  return clamp(Math.round((pacePosition * 0.7 + qualifyingPosition * 0.3)), 1, 20);
}

export function pointsForFinish(position: number): number {
  const table = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return table[position - 1] ?? 0;
}
