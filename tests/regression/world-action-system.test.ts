import { describe, expect, test } from 'vitest';
import { narrativeWeightModifier } from '@/lib/engine/simulation/event-engine';
import { applyPendingConsequences, buildIntent, resolveWorldAction } from '@/lib/engine/simulation/intent-engine';
import { starterEvents } from '@/lib/data/events/career-events';
import { useCareerStore } from '@/lib/store/career-store';

describe('world action system', () => {
  test('open-ended text always creates a resolved world action and memory entry', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const text = 'Sneak into paddock nightlife then leak setup rumors to media';
    const intent = buildIntent(text, world);
    const result = resolveWorldAction(world, text, intent);

    expect(result.action.text).toBe(text);
    expect(['success', 'mixed', 'failure']).toContain(result.action.resolution);
    expect(result.world.recentActions.length).toBeGreaterThanOrEqual(1);
    expect(result.world.actionMemory[0]?.id).toBe(result.action.id);
  });

  test('repeated behavior emerges into persistent trait movement', () => {
    let world = structuredClone(useCareerStore.getState().world);
    const before = world.emergentTraits.reckless;

    for (const text of ['take risky move', 'gamble with media leak', 'reckless confrontation with rival']) {
      const intent = buildIntent(text, world);
      world = resolveWorldAction(world, text, intent).world;
    }

    expect(world.emergentTraits.reckless).toBeGreaterThan(before);
    expect(world.actionMemory.length).toBeGreaterThanOrEqual(3);
  });

  test('action outcome updates event pressure/hype weighting flags and memory context', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const sampleAction = {
      id: 'sample-action',
      text: 'sample',
      category: 'media' as const,
      tone: 'safe' as const,
      target: 'self' as const,
      tags: ['media', 'safe', 'self', 'world-action', 'mixed'],
      createdAt: world.currentDate,
      resolution: 'mixed' as const,
      score: 0,
      difficulty: 30,
      summary: 'sample',
    };

    const pressureWorld = {
      ...world,
      flags: { ...world.flags, actionPressure: true, actionHype: false, actionConflict: false },
      actionMemory: [{ ...sampleAction, id: 'am-1', tone: 'risky' as const, target: 'rival' as const }],
      emergentTraits: { ...world.emergentTraits, reckless: 70 },
    };

    const hypeWorld = {
      ...world,
      flags: { ...world.flags, actionPressure: false, actionHype: true, actionConflict: false },
      actionMemory: [{ ...sampleAction, id: 'am-2' }],
      emergentTraits: { ...world.emergentTraits, mediaSavvy: 70 },
    };

    const pressureEvent = starterEvents.find((event) => event.category.toLowerCase().includes('pressure'));
    const breakoutEvent = starterEvents.find((event) => event.category.toLowerCase().includes('breakout'));

    expect(pressureEvent).toBeDefined();
    expect(breakoutEvent).toBeDefined();

    expect(narrativeWeightModifier(pressureEvent!, pressureWorld)).toBeGreaterThan(1);
    expect(narrativeWeightModifier(breakoutEvent!, hypeWorld)).toBeGreaterThan(1);
  });

  test('pending consequence chain is applied in later rounds', () => {
    const base = structuredClone(useCareerStore.getState().world);
    const intent = buildIntent('manipulate media narrative and attack rival', base);
    const acted = resolveWorldAction(base, intent.text, intent).world;

    expect(acted.pendingConsequences.length).toBeGreaterThan(0);

    const advanced = applyPendingConsequences({
      ...acted,
      currentSeason: { ...acted.currentSeason, round: acted.currentSeason.round + 2 },
    });

    expect(advanced.pendingConsequences.length).toBeLessThan(acted.pendingConsequences.length);
    expect(advanced.history[0]?.text).toContain('Follow-up consequence');
  });
});
