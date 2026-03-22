import { describe, expect, test } from 'vitest';
import { applyIntentImmediateEffects, buildIntent, parseIntent, resolveWorldAction } from '@/lib/engine/simulation/intent-engine';
import { useCareerStore } from '@/lib/store/career-store';

describe('intent parser', () => {
  test('parses training aggressive self intent', () => {
    const world = useCareerStore.getState().world;
    const parsed = parseIntent('train hard and push limits', world.drivers);

    expect(parsed.category).toBe('training');
    expect(parsed.tone).toBe('aggressive');
    expect(parsed.target).toBe('self');
  });

  test('detects team target', () => {
    const world = useCareerStore.getState().world;
    const parsed = parseIntent('focus on helping the team setup', world.drivers);
    expect(parsed.target).toBe('team');
  });
});

describe('world action resolution', () => {
  test('resolves deterministic action outcome from world state', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const intent = buildIntent('Visit rival driver and confront him publicly', world);

    const a = resolveWorldAction(world, intent.text, intent);
    const b = resolveWorldAction(world, intent.text, intent);

    expect(a.action.resolution).toBe(b.action.resolution);
    expect(a.action.score).toBe(b.action.score);
    expect(a.world.lastAction?.id).toBe(a.action.id);
    expect(a.world.recentActions[0]?.id).toBe(a.action.id);
  });

  test('applies action consequences and keeps active intent state', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const intent = buildIntent('Train aggressively for next race', world);
    const updated = applyIntentImmediateEffects(world, intent);

    expect(updated.playerIntent).not.toBeNull();
    expect(updated.playerIntent?.tags.some((tag) => ['success', 'mixed', 'failure'].includes(tag))).toBe(true);
    expect(updated.lastAction).not.toBeNull();
    expect(updated.history[0]?.text).toContain('World action');
  });
});
