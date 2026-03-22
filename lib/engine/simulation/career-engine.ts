import type { EventInstance, NewsItem, WorldState } from '@/lib/schema';
import { worldStateSchema } from '@/lib/schema';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function clampCriticalState(world: WorldState): WorldState {
  const next = {
    ...world,
    confidence: clamp(world.confidence, 0, 100),
    fia: { scrutiny: clamp(world.fia.scrutiny, 0, 100) },
    market: { value: Math.max(0, world.market.value) },
    player: {
      ...world.player,
      publicImage: {
        ...world.player.publicImage,
        popularity: clamp(world.player.publicImage.popularity, 0, 100),
        respect: clamp(world.player.publicImage.respect, 0, 100),
        controversy: clamp(world.player.publicImage.controversy, 0, 100),
      },
    },
    teams: world.teams.map((team) => ({
      ...team,
      morale: clamp(team.morale, 0, 100),
      trustInPlayer: clamp(team.trustInPlayer, 0, 100),
      carStrength: clamp(team.carStrength, 0, 100),
    })),
  };

  return worldStateSchema.parse(next);
}

export interface DecisionApplicationResult {
  ok: boolean;
  world: WorldState;
  reason?: string;
}

export function applyDecisionEffects(world: WorldState, event: EventInstance, choiceId: string): DecisionApplicationResult {
  const choice = event.choices.find((item) => item.id === choiceId);
  if (!choice) {
    return { ok: false, reason: `Choice ${choiceId} not found for event ${event.id}`, world };
  }

  const fx = choice.effects;
  const updated: WorldState = {
    ...world,
    confidence: world.confidence + fx.confidenceDelta,
    market: { value: world.market.value + fx.marketValueDelta },
    player: {
      ...world.player,
      publicImage: {
        ...world.player.publicImage,
        popularity: world.player.publicImage.popularity + fx.popularityDelta,
        respect: world.player.publicImage.respect + fx.respectDelta,
        controversy: world.player.publicImage.controversy + fx.controversyDelta,
      },
    },
    teams: world.teams.map((team, idx) =>
      idx === 0
        ? {
            ...team,
            trustInPlayer: team.trustInPlayer + fx.teamTrustDelta,
            morale: team.morale + fx.moraleDelta,
          }
        : team,
    ),
    fia: { scrutiny: world.fia.scrutiny + fx.fiaScrutinyDelta },
    relationships: world.relationships.map((rel, idx) =>
      idx === 0
        ? {
            ...rel,
            trust: rel.trust + fx.relationshipDelta,
            hostility: rel.hostility - Math.round(fx.relationshipDelta / 2),
          }
        : rel,
    ),
    inbox: world.inbox.filter((item) => item.id !== event.id),
    history: [
      {
        id: `hist-choice-${event.id}`,
        text: `Decision on ${event.title}: ${choice.label}`,
        createdAt: world.currentDate,
      },
      ...world.history,
    ].slice(0, 40),
  };

  return { ok: true, world: clampCriticalState(updated) };
}

function dedupeNews(items: NewsItem[]): NewsItem[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  return items.filter((item) => {
    const normalizedHeadline = item.headline.trim().toLowerCase();
    if (seenIds.has(item.id) || seenTitles.has(normalizedHeadline)) return false;
    seenIds.add(item.id);
    seenTitles.add(normalizedHeadline);
    return true;
  });
}

export function appendNews(world: WorldState, item: NewsItem): WorldState {
  const merged = dedupeNews([item, ...world.newsFeed]);
  return {
    ...world,
    newsFeed: merged.slice(0, 8),
  };
}
