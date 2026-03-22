import { describe, expect, test } from 'vitest';
import { narrativeWeightModifier } from '@/lib/engine/simulation/event-engine';
import { buildIntent, resolveWorldAction } from '@/lib/engine/simulation/intent-engine';
import { starterEvents } from '@/lib/data/events/career-events';
import { useCareerStore } from '@/lib/store/career-store';

describe('world action system', () => {
  test('open-ended text always creates a resolved world action', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const text = 'Sneak into paddock nightlife then leak setup rumors to media';
    const intent = buildIntent(text, world);
    const result = resolveWorldAction(world, text, intent);

    expect(result.action.text).toBe(text);
    expect(['success', 'mixed', 'failure']).toContain(result.action.resolution);
    expect(result.world.recentActions.length).toBeGreaterThanOrEqual(1);
  });

  test('action outcome updates event pressure/hype weighting flags', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const pressureWorld = {
      ...world,
      flags: { ...world.flags, actionPressure: true, actionHype: false, actionConflict: false },
    };

    const hypeWorld = {
      ...world,
      flags: { ...world.flags, actionPressure: false, actionHype: true, actionConflict: false },
    };

    const pressureEvent = starterEvents.find((event) => event.category.toLowerCase().includes('pressure'));
    const breakoutEvent = starterEvents.find((event) => event.category.toLowerCase().includes('breakout'));

    expect(pressureEvent).toBeDefined();
    expect(breakoutEvent).toBeDefined();

    expect(narrativeWeightModifier(pressureEvent!, pressureWorld)).toBeGreaterThan(1);
    expect(narrativeWeightModifier(breakoutEvent!, hypeWorld)).toBeGreaterThan(1);
  });
});
