import { starterEvents } from '@/lib/data/events/career-events';
import type { EventDefinition, EventInstance, WorldState } from '@/lib/schema';
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

export function narrativeWeightModifier(event: EventDefinition, state: WorldState): number {
  const category = event.category.toLowerCase();

  if (state.narrativeArc === 'slump' || state.narrativeArc === 'pressure-building') {
    if (category.includes('pressure') || category.includes('fia') || category.includes('backlash')) return 1.35;
    if (category.includes('breakout')) return 0.8;
  }

  if (state.narrativeArc === 'breakout-run' || state.narrativeArc === 'recovery') {
    if (category.includes('breakout') || category.includes('interview') || category.includes('academy')) return 1.3;
    if (category.includes('backlash')) return 0.85;
  }

  if (state.form === 'volatile' && category.includes('rumor')) return 1.2;


  if (state.flags.actionPressure) {
    if (category.includes('pressure') || category.includes('fia') || category.includes('backlash')) return 1.2;
  }

  if (state.flags.actionHype) {
    if (category.includes('breakout') || category.includes('academy') || category.includes('media')) return 1.15;
  }

  if (state.flags.actionConflict && (category.includes('teammate') || category.includes('rival') || category.includes('rumor'))) {
    return 1.2;
  }
  const intentCategory = state.playerIntent?.category;
  if (intentCategory === 'media' && category.includes('media')) return 1.2;
  if ((intentCategory === 'training' || intentCategory === 'focus') && (category.includes('breakout') || category.includes('performance'))) return 1.15;
  if (intentCategory === 'social' && category.includes('friendship')) return 1.2;

  return 1;
}

export function pickEvent(state: WorldState, seed: number): EventDefinition | null {
  const eligible = listEligibleEvents(state);
  if (!eligible.length) return null;
  const rng = createSeededRng(seed);

  return weightedChoice(
    eligible.map((item) => ({
      item,
      weight: Math.max(0.1, item.weight * narrativeWeightModifier(item, state)),
    })),
    rng,
  );
}

export function materializeEvent(definition: EventDefinition, currentDate: string, seed: number): EventInstance {
  return {
    id: `evt-${definition.id}-${seed}`,
    definitionId: definition.id,
    title: definition.title,
    description: definition.descriptionTemplate,
    choices: definition.choices,
    createdAt: currentDate,
  };
}
