import { beforeEach, describe, expect, test } from 'vitest';
import { useCareerStore } from '@/lib/store/career-store';

const base = useCareerStore.getState().world;

describe('decision application', () => {
  beforeEach(() => {
    useCareerStore.setState({ world: structuredClone(base) });
  });

  test('applies event choice effects to world state', () => {
    const store = useCareerStore.getState();
    store.enqueueEvent({
      id: 'evt-1',
      definitionId: 'media-pressure',
      title: 'Media pressure',
      description: 'test',
      createdAt: '2026-03-21',
      choices: [
        {
          id: 'choice-1',
          label: 'Answer calmly',
          tone: 'calm',
          effects: {
            popularityDelta: 5,
            respectDelta: 2,
            controversyDelta: -1,
            teamTrustDelta: 4,
            fiaScrutinyDelta: -2,
            relationshipDelta: 3,
            moraleDelta: 2,
            confidenceDelta: 6,
            marketValueDelta: 120000,
          },
        },
      ],
    });

    useCareerStore.getState().applyDecision({
      id: 'd-1',
      eventInstanceId: 'evt-1',
      choiceId: 'choice-1',
      decidedAt: '2026-03-21',
    });

    const updated = useCareerStore.getState().world;
    expect(updated.player.publicImage.popularity).toBe(base.player.publicImage.popularity + 5);
    expect(updated.fia.scrutiny).toBe(base.fia.scrutiny - 2);
    expect(updated.teams[0].trustInPlayer).toBe(base.teams[0].trustInPlayer + 4);
    expect(updated.market.value).toBe(base.market.value + 120000);
    expect(updated.inbox.find((item) => item.id === 'evt-1')).toBeUndefined();
  });
});
