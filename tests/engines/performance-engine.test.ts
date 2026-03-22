import { describe, expect, test } from 'vitest';
import { raceScoreToFinish, scoreToGridPosition, simulatePerformance } from '@/lib/engine/simulation/performance-engine';

const input = {
  seed: 22,
  rawPace: 80,
  qualifyingPace: 82,
  racePace: 78,
  consistency: 75,
  pressureHandling: 70,
  teamStrength: 65,
  weatherVolatility: 45,
  morale: 60,
  confidence: 58,
};

describe('performance engine', () => {
  test('returns output in valid ranges', () => {
    const result = simulatePerformance(input);

    expect(result.qualifying.score).toBeGreaterThanOrEqual(0);
    expect(result.qualifying.score).toBeLessThanOrEqual(100);
    expect(result.race.score).toBeGreaterThanOrEqual(0);
    expect(result.race.score).toBeLessThanOrEqual(100);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  test('is deterministic for the same seed', () => {
    expect(simulatePerformance(input)).toEqual(simulatePerformance(input));
  });

  test('maps scores to meaningful finishing positions', () => {
    expect(scoreToGridPosition(90)).toBeLessThan(scoreToGridPosition(60));
    expect(raceScoreToFinish(92, 8)).toBeLessThanOrEqual(8);
  });
});
