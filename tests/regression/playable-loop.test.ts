import { beforeEach, describe, expect, test } from 'vitest';
import { useCareerStore } from '@/lib/store/career-store';

const baseline = structuredClone(useCareerStore.getState().world);

const fresh = () => structuredClone(baseline);

describe('playable loop', () => {
  beforeEach(() => {
    useCareerStore.setState({ world: fresh() });
  });

  test('create career -> qualifying -> race -> event -> decision updates state', () => {
    const store = useCareerStore.getState();
    store.createCareer({ name: 'Lena Hart', nationality: 'GBR', archetype: 'antihero', seed: 5 });
    store.simulateQualifying(507);
    store.simulateRace(519);

    let world = useCareerStore.getState().world;
    expect(world.lastWeekend).not.toBeNull();
    expect(world.newsFeed.length).toBeGreaterThanOrEqual(2);
    expect(world.currentSeason.playerPoints).toBeGreaterThanOrEqual(0);
    expect(world.inbox.length).toBeGreaterThanOrEqual(1);

    const firstEvent = world.inbox[0];
    const choice = firstEvent.choices[0];
    store.applyDecision({
      id: 'golden-choice',
      eventInstanceId: firstEvent.id,
      choiceId: choice.id,
      decidedAt: world.currentDate,
    });

    world = useCareerStore.getState().world;
    expect(world.inbox.length).toBe(0);
    expect(world.history[0]?.text).toContain('Decision on');
  });

  test('seed stability for full weekend simulation', () => {
    const store = useCareerStore.getState();
    store.createCareer({ name: 'Seed Driver', nationality: 'USA', archetype: 'machine', seed: 9 });
    store.simulateWeekend(777);
    const a = structuredClone(useCareerStore.getState().world.lastWeekend);

    useCareerStore.setState({ world: fresh() });
    useCareerStore.getState().createCareer({ name: 'Seed Driver', nationality: 'USA', archetype: 'machine', seed: 9 });
    useCareerStore.getState().simulateWeekend(777);
    const b = structuredClone(useCareerStore.getState().world.lastWeekend);

    expect(a).toEqual(b);
  });
});
