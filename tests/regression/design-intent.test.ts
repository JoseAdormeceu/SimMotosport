import { beforeEach, describe, expect, test } from 'vitest';
import { useCareerStore } from '@/lib/store/career-store';

const baseline = structuredClone(useCareerStore.getState().world);

function freshWorld() {
  return structuredClone(baseline);
}

describe('design intent regression', () => {
  beforeEach(() => {
    useCareerStore.setState({ world: freshWorld() });
  });

  test('stronger car and higher skill trend toward better race finishes', () => {
    const low = freshWorld();
    low.player.skills.rawPace = 58;
    low.player.skills.qualifyingPace = 56;
    low.player.skills.racePace = 57;
    low.teams[0].carStrength = 50;

    const high = freshWorld();
    high.player.skills.rawPace = 86;
    high.player.skills.qualifyingPace = 88;
    high.player.skills.racePace = 87;
    high.teams[0].carStrength = 84;

    let lowTotal = 0;
    let highTotal = 0;

    for (let i = 0; i < 12; i += 1) {
      useCareerStore.setState({ world: structuredClone(low) });
      useCareerStore.getState().simulateWeekend(500 + i);
      lowTotal += useCareerStore.getState().world.lastWeekend?.racePosition ?? 20;

      useCareerStore.setState({ world: structuredClone(high) });
      useCareerStore.getState().simulateWeekend(500 + i);
      highTotal += useCareerStore.getState().world.lastWeekend?.racePosition ?? 20;
    }

    expect(highTotal).toBeLessThan(lowTotal);
  });

  test('decision branches produce meaningfully different controversy outcomes', () => {
    const store = useCareerStore.getState();
    store.simulateWeekend(700);
    const event = useCareerStore.getState().world.inbox[0];
    expect(event).toBeTruthy();

    const worldA = structuredClone(useCareerStore.getState().world);
    const worldB = structuredClone(useCareerStore.getState().world);

    useCareerStore.setState({ world: worldA });
    useCareerStore.getState().applyDecision({
      id: 'branch-a',
      eventInstanceId: event.id,
      choiceId: event.choices[0].id,
      decidedAt: worldA.currentDate,
    });
    const controversyA = useCareerStore.getState().world.player.publicImage.controversy;

    useCareerStore.setState({ world: worldB });
    const altChoice = event.choices[1] ?? event.choices[0];
    useCareerStore.getState().applyDecision({
      id: 'branch-b',
      eventInstanceId: event.id,
      choiceId: altChoice.id,
      decidedAt: worldB.currentDate,
    });
    const controversyB = useCareerStore.getState().world.player.publicImage.controversy;

    expect(Math.abs(controversyA - controversyB)).toBeGreaterThanOrEqual(2);
  });
});
