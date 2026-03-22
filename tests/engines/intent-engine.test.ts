import { describe, expect, test } from 'vitest';
import { applyIntentImmediateEffects, buildIntent, parseIntent } from '@/lib/engine/simulation/intent-engine';
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

describe('intent effects', () => {
  test('applies deterministic immediate deltas and stores active intent', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const intent = buildIntent('Train aggressively for next race', world);
    const updated = applyIntentImmediateEffects(world, intent);

    expect(updated.playerIntent?.active).toBe(true);
    expect(updated.confidence).toBeGreaterThanOrEqual(world.confidence);
  });
});
