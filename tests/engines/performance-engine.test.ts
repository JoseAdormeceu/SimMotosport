import { describe, expect, test } from 'vitest';
import { simulatePerformance } from '@/lib/engine/simulation/performance-engine';

describe('performance engine', () => {
  test('returns output in valid ranges', () => {
    const result = simulatePerformance({
      seed: 1,
      skill: 80,
      consistency: 75,
      pressureHandling: 70,
      teamStrength: 65,
      weatherVolatility: 45,
      morale: 60,
    });

    expect(result.qualifyingScore).toBeGreaterThanOrEqual(0);
    expect(result.qualifyingScore).toBeLessThanOrEqual(100);
    expect(result.raceScore).toBeGreaterThanOrEqual(0);
    expect(result.raceScore).toBeLessThanOrEqual(100);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  test('is deterministic for the same seed', () => {
    const input = {
      seed: 22,
      skill: 80,
      consistency: 75,
      pressureHandling: 70,
      teamStrength: 65,
      weatherVolatility: 45,
      morale: 60,
    };

    expect(simulatePerformance(input)).toEqual(simulatePerformance(input));
  });
});
