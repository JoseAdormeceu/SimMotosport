import { describe, expect, test } from 'vitest';
import { createRaceHeadline } from '@/lib/engine/generators/headline-generator';
import { appendNews } from '@/lib/engine/simulation/career-engine';
import { useCareerStore } from '@/lib/store/career-store';

describe('headline generation', () => {
  test('is deterministic for same context', () => {
    const context = {
      seed: 900,
      round: 3,
      venue: 'Monza',
      driver: 'Ari Vega',
      finishPosition: 3,
      expectedPosition: 8,
      reputation: 65,
      recentForm: 72,
      controversy: 20,
    } as const;

    expect(createRaceHeadline(context)).toEqual(createRaceHeadline(context));
  });

  test('changes tone/band with underperformance and high controversy', () => {
    const headline = createRaceHeadline({
      seed: 901,
      round: 3,
      venue: 'Monza',
      driver: 'Ari Vega',
      finishPosition: 14,
      expectedPosition: 8,
      reputation: 42,
      recentForm: 30,
      controversy: 78,
    });

    expect(headline.band).toBe('underperformance');
    expect(headline.tone).toBe('criticism');
  });
});

describe('news feed dedup', () => {
  test('deduplicates repeated ids and headlines', () => {
    const world = structuredClone(useCareerStore.getState().world);
    const once = appendNews(world, {
      id: 'news-race-r1-s1',
      headline: 'Ari Vega drags the car to P3 in a statement drive at Monza',
      summary: 'test',
      tags: ['race'],
      createdAt: world.currentDate,
    });

    const duplicateId = appendNews(once, {
      id: 'news-race-r1-s1',
      headline: 'Different headline',
      summary: 'test-2',
      tags: ['race'],
      createdAt: world.currentDate,
    });

    const duplicateHeadline = appendNews(duplicateId, {
      id: 'news-race-r1-s2',
      headline: 'Ari Vega drags the car to P3 in a statement drive at Monza',
      summary: 'test-3',
      tags: ['race'],
      createdAt: world.currentDate,
    });

    expect(duplicateHeadline.newsFeed.length).toBe(1);
  });
});
