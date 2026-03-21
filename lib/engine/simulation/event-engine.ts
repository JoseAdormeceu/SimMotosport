import { starterEvents } from '@/lib/data/events/career-events';
import type { EventDefinition, WorldState } from '@/lib/schema';
import { createSeededRng } from '../utils/random';
import { weightedChoice } from '../utils/weighted-choice';

export function listEligibleEvents(state: WorldState): EventDefinition[] {
  return starterEvents.filter((event) => {
    const minRoundOk = event.trigger.minRound ? state.currentSeason.round >= event.trigger.minRound : true;
    const maxFiaOk = event.trigger.maxFiaScrutiny ? state.fia.scrutiny <= event.trigger.maxFiaScrutiny : true;
    const minControversyOk = event.trigger.minControversy
      ? state.player.publicImage.controversy >= event.trigger.minControversy
      : true;
    return minRoundOk && maxFiaOk && minControversyOk;
  });
}

export function pickEvent(state: WorldState, seed: number): EventDefinition | null {
  const eligible = listEligibleEvents(state);
  if (!eligible.length) return null;
  const rng = createSeededRng(seed);
  return weightedChoice(
    eligible.map((item) => ({ item, weight: item.weight })),
    rng,
  );
}
