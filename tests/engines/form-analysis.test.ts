import { describe, expect, test } from 'vitest';
import { createRaceHeadline } from '@/lib/engine/generators/headline-generator';
import { analyzeForm } from '@/lib/engine/simulation/form-engine';

describe('form analysis', () => {
  test('classifies improving and breakout run', () => {
    const analysis = analyzeForm(
      [
        { round: 1, finishPosition: 11, expectedPosition: 10, points: 0, band: 'underperformance' },
        { round: 2, finishPosition: 8, expectedPosition: 9, points: 4, band: 'expected' },
        { round: 3, finishPosition: 5, expectedPosition: 8, points: 10, band: 'overperformance' },
        { round: 4, finishPosition: 3, expectedPosition: 7, points: 15, band: 'overperformance' },
      ],
      20,
    );

    expect(analysis.form).toBe('improving');
    expect(analysis.arc).toBe('breakout-run');
  });

  test('classifies declining pressure building', () => {
    const analysis = analyzeForm(
      [
        { round: 1, finishPosition: 6, expectedPosition: 8, points: 8, band: 'overperformance' },
        { round: 2, finishPosition: 10, expectedPosition: 8, points: 1, band: 'underperformance' },
        { round: 3, finishPosition: 13, expectedPosition: 8, points: 0, band: 'underperformance' },
        { round: 4, finishPosition: 15, expectedPosition: 9, points: 0, band: 'underperformance' },
      ],
      70,
    );

    expect(analysis.form).toBe('declining');
    expect(analysis.arc).toBe('slump');
  });
});

describe('headline form continuity', () => {
  test('same finish can produce different headlines with different form context', () => {
    const base = {
      seed: 777,
      round: 5,
      venue: 'Monza',
      driver: 'Ari Vega',
      finishPosition: 9,
      expectedPosition: 9,
      reputation: 58,
      recentFormScore: 55,
      controversy: 32,
    } as const;

    const improving = createRaceHeadline({ ...base, recentFormLabel: 'improving', narrativeArc: 'recovery' });
    const declining = createRaceHeadline({ ...base, recentFormLabel: 'declining', narrativeArc: 'pressure-building' });

    expect(improving.headline).not.toEqual(declining.headline);
  });
});
