import { describe, expect, test } from 'vitest';
import { assertStageTransition, confidenceDeltaForFinish, simulateQualifyingStep, simulateRaceStep } from '@/lib/engine/simulation/weekend-engine';
import { useCareerStore } from '@/lib/store/career-store';

describe('weekend flow invariants', () => {
  test('enforces legal stage transitions', () => {
    expect(assertStageTransition('idle', 'qualifying')).toBe(true);
    expect(assertStageTransition('qualifying', 'race')).toBe(true);
    expect(assertStageTransition('race', 'postWeekend')).toBe(true);
    expect(assertStageTransition('race', 'qualifying')).toBe(false);
  });

  test('qualifying then race produces valid staged progression', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const qual = simulateQualifyingStep(world, 123);
    expect(qual.ok).toBe(true);
    expect(qual.world.currentSeason.weekendStage).toBe('race');

    const race = simulateRaceStep(qual.world, 124);
    expect(race.ok).toBe(true);
    expect(race.world.currentSeason.weekendStage).toBe('postWeekend');
    expect(race.points).toBeGreaterThanOrEqual(0);
  });

  test('confidence deltas align with design intent', () => {
    expect(confidenceDeltaForFinish(2)).toBeGreaterThan(0);
    expect(confidenceDeltaForFinish(10)).toBe(0);
    expect(confidenceDeltaForFinish(19)).toBeLessThan(0);
  });
});
