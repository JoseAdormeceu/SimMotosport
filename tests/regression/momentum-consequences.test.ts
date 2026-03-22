import { describe, expect, test } from 'vitest';
import { starterEvents } from '@/lib/data/events/career-events';
import { narrativeWeightModifier } from '@/lib/engine/simulation/event-engine';
import { simulateQualifyingStep, simulateRaceStep } from '@/lib/engine/simulation/weekend-engine';
import { useCareerStore } from '@/lib/store/career-store';

describe('momentum gameplay consequences', () => {
  test('slump increases pressure-event weight relative to breakout run', () => {
    const base = structuredClone(useCareerStore.getState().world);
    const pressureEvent = starterEvents.find((event) => event.id === 'media-pressure');
    const breakoutEvent = starterEvents.find((event) => event.id === 'breakout-performance');

    expect(pressureEvent).toBeTruthy();
    expect(breakoutEvent).toBeTruthy();

    const slumpWorld = { ...base, narrativeArc: 'slump' as const, form: 'declining' as const };
    const breakoutWorld = { ...base, narrativeArc: 'breakout-run' as const, form: 'improving' as const };

    expect(narrativeWeightModifier(pressureEvent!, slumpWorld)).toBeGreaterThan(narrativeWeightModifier(pressureEvent!, breakoutWorld));
    expect(narrativeWeightModifier(breakoutEvent!, breakoutWorld)).toBeGreaterThan(narrativeWeightModifier(breakoutEvent!, slumpWorld));
  });

  test('team trust reacts to form-weighted race outcomes', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const qualifying = simulateQualifyingStep(world, 444);
    const raceGood = simulateRaceStep({ ...qualifying.world, form: 'improving', narrativeArc: 'breakout-run' }, 445);
    const raceBad = simulateRaceStep({ ...qualifying.world, form: 'declining', narrativeArc: 'slump' }, 445);

    expect(raceGood.ok).toBe(true);
    expect(raceBad.ok).toBe(true);

    const trustGood = raceGood.world.teams[0].trustInPlayer;
    const trustBad = raceBad.world.teams[0].trustInPlayer;

    expect(trustGood).toBeGreaterThanOrEqual(trustBad);
  });
});
