import { describe, expect, test } from 'vitest';
import { listEligibleEvents } from '@/lib/engine/simulation/event-engine';
import { useCareerStore } from '@/lib/store/career-store';

describe('event eligibility', () => {
  test('filters by round and controversy thresholds', () => {
    const world = useCareerStore.getState().world;
    const early = listEligibleEvents(world);
    const withControversy = listEligibleEvents({
      ...world,
      currentSeason: { ...world.currentSeason, round: 6 },
      player: {
        ...world.player,
        publicImage: { ...world.player.publicImage, controversy: 55 },
      },
    });

    expect(early.some((e) => e.id === 'moral-dilemma')).toBe(false);
    expect(withControversy.some((e) => e.id === 'moral-dilemma')).toBe(true);
    expect(withControversy.some((e) => e.id === 'public-backlash')).toBe(true);
  });
});
