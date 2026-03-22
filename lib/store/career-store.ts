import { create } from 'zustand';
import type { Decision, EventDefinition, EventInstance, WeekendSummary, WorldState } from '@/lib/schema';
import { worldStateSchema } from '@/lib/schema';
import { materializeEvent, pickEvent } from '@/lib/engine/simulation/event-engine';
import {
  pointsForFinish,
  raceScoreToFinish,
  scoreToGridPosition,
  simulatePerformance,
  simulateQualifying,
  simulateRace,
} from '@/lib/engine/simulation/performance-engine';
import { saveCareerToStorage } from '@/lib/persistence/local-storage';

export interface CreateCareerInput {
  name: string;
  nationality: string;
  archetype: WorldState['player']['archetype'];
  seed?: number;
}

interface CareerStore {
  world: WorldState;
  createCareer: (input: CreateCareerInput) => void;
  loadCareer: (world: WorldState) => void;
  saveCareer: () => void;
  advanceDay: () => void;
  enqueueEvent: (event: EventInstance) => void;
  applyEvent: (event: EventDefinition, seed?: number) => void;
  applyDecision: (decision: Decision) => void;
  simulateQualifying: (seed?: number) => void;
  simulateRace: (seed?: number) => void;
  simulateWeekend: (seed?: number) => void;
  advanceSeasonPhase: () => void;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function withDefaults(base: Partial<WorldState> = {}): WorldState {
  const template: WorldState = {
    currentDate: '2026-03-21',
    currentCategory: 'f4',
    currentSeason: {
      year: 2026,
      category: 'f4',
      round: 1,
      totalRounds: 10,
      playerPoints: 0,
      championshipPosition: 12,
      phase: 'inSeason',
      weekendStage: 'idle',
      nextVenue: 'Monza',
    },
    player: {
      id: 'player-1',
      name: 'Player Driver',
      age: 17,
      nationality: 'ITA',
      archetype: 'prodigy',
      traits: {},
      skills: {
        rawPace: 82,
        qualifyingPace: 80,
        racePace: 78,
        tyreManagement: 74,
        wetWeather: 70,
        consistency: 68,
        racecraft: 72,
        starts: 71,
        adaptability: 77,
        pressureHandling: 66,
        feedbackQuality: 75,
        developmentInfluence: 69,
      },
      personality: {
        aggression: 63,
        discipline: 64,
        confidence: 74,
        ego: 61,
        diplomacy: 52,
        honesty: 67,
        ruthlessness: 59,
        independence: 73,
        mediaSavvy: 62,
        loyalty: 58,
      },
      values: {},
      publicImage: {
        popularity: 46,
        respect: 45,
        controversy: 22,
        mystique: 40,
        authenticity: 58,
        villainAura: 18,
        superstarAura: 35,
      },
      hiddenModifiers: {},
    },
    teams: [{ id: 'team-f4-1', name: 'Aster Junior', category: 'f4', carStrength: 68, morale: 62, trustInPlayer: 58 }],
    drivers: [
      { id: 'drv-rival', name: 'Rival Driver', category: 'f4', overall: 75 },
      { id: 'drv-ally', name: 'Ally Driver', category: 'f4', overall: 70 },
    ],
    relationships: [
      {
        id: 'rel-rival',
        targetDriverId: 'drv-rival',
        respect: 10,
        trust: -15,
        hostility: 35,
        envy: 20,
        admiration: 5,
        closeness: -10,
        politicalAlignment: -5,
        label: 'rival',
      },
      {
        id: 'rel-ally',
        targetDriverId: 'drv-ally',
        respect: 22,
        trust: 30,
        hostility: -10,
        envy: 0,
        admiration: 24,
        closeness: 20,
        politicalAlignment: 12,
        label: 'ally',
      },
    ],
    contracts: [
      { id: 'ctr-1', teamId: 'team-f4-1', role: 'primary', startYear: 2026, endYear: 2026, salary: 250000, active: true },
    ],
    media: { sentiment: 5 },
    fia: { scrutiny: 10 },
    fandom: { support: 50 },
    market: { value: 1000000 },
    confidence: 55,
    history: [],
    inbox: [],
    newsFeed: [],
    lastWeekend: null,
    flags: {},
  };

  return worldStateSchema.parse({ ...template, ...base });
}

const initialWorld = withDefaults();

function applyChoiceToWorld(world: WorldState, event: EventInstance, choiceId: string): WorldState {
  const choice = event.choices.find((item) => item.id === choiceId);
  if (!choice) return world;
  const fx = choice.effects;

  const updated: WorldState = {
    ...world,
    confidence: clamp(world.confidence + fx.confidenceDelta),
    market: { value: Math.max(0, world.market.value + fx.marketValueDelta) },
    player: {
      ...world.player,
      publicImage: {
        ...world.player.publicImage,
        popularity: clamp(world.player.publicImage.popularity + fx.popularityDelta),
        respect: clamp(world.player.publicImage.respect + fx.respectDelta),
        controversy: clamp(world.player.publicImage.controversy + fx.controversyDelta),
      },
    },
    teams: world.teams.map((team, idx) =>
      idx === 0
        ? {
            ...team,
            trustInPlayer: clamp(team.trustInPlayer + fx.teamTrustDelta),
            morale: clamp(team.morale + fx.moraleDelta),
          }
        : team,
    ),
    fia: { scrutiny: clamp(world.fia.scrutiny + fx.fiaScrutinyDelta) },
    relationships: world.relationships.map((rel, idx) =>
      idx === 0
        ? {
            ...rel,
            trust: clamp(rel.trust + fx.relationshipDelta, -100, 100),
            hostility: clamp(rel.hostility - Math.round(fx.relationshipDelta / 2), -100, 100),
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

  return worldStateSchema.parse(updated);
}

function buildPerformanceInput(world: WorldState, seed: number) {
  return {
    seed,
    rawPace: world.player.skills.rawPace,
    qualifyingPace: world.player.skills.qualifyingPace,
    racePace: world.player.skills.racePace,
    consistency: world.player.skills.consistency,
    pressureHandling: world.player.skills.pressureHandling,
    teamStrength: world.teams[0]?.carStrength ?? 50,
    weatherVolatility: 35 + (seed % 20),
    morale: world.teams[0]?.morale ?? 50,
    confidence: world.confidence,
  };
}

function appendNews(world: WorldState, headline: string, summary: string, tags: string[]): WorldState {
  return {
    ...world,
    newsFeed: [{ id: `news-${world.newsFeed.length + 1}-${world.currentDate}`, headline, summary, tags, createdAt: world.currentDate }, ...world.newsFeed].slice(0, 8),
  };
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  world: initialWorld,
  createCareer: (input) =>
    set(() =>
      ({
        world: withDefaults({
          player: {
            ...initialWorld.player,
            id: `player-${(input.seed ?? 1) + 1}`,
            name: input.name,
            nationality: input.nationality,
            archetype: input.archetype,
          },
        }),
      }),
    ),
  loadCareer: (world) => set({ world: worldStateSchema.parse(world) }),
  saveCareer: () => saveCareerToStorage(get().world),
  advanceDay: () =>
    set((state) => {
      const date = new Date(state.world.currentDate);
      date.setUTCDate(date.getUTCDate() + 1);
      const nextDate = date.toISOString().slice(0, 10);

      const nextStage =
        state.world.currentSeason.weekendStage === 'idle'
          ? 'qualifying'
          : state.world.currentSeason.weekendStage === 'qualifying'
            ? 'race'
            : state.world.currentSeason.weekendStage === 'race'
              ? 'postWeekend'
              : 'idle';

      return {
        world: {
          ...state.world,
          currentDate: nextDate,
          currentSeason: {
            ...state.world.currentSeason,
            weekendStage: nextStage,
          },
        },
      };
    }),
  enqueueEvent: (event) => set((state) => ({ world: { ...state.world, inbox: [...state.world.inbox, event] } })),
  applyEvent: (event, seed = 42) =>
    set((state) => ({
      world: {
        ...state.world,
        inbox: [...state.world.inbox, materializeEvent(event, state.world.currentDate, seed)],
      },
    })),
  applyDecision: (decision) =>
    set((state) => {
      const event = state.world.inbox.find((item) => item.id === decision.eventInstanceId);
      if (!event) return state;
      return { world: applyChoiceToWorld(state.world, event, decision.choiceId) };
    }),
  simulateQualifying: (seed = 101) =>
    set((state) => {
      if (state.world.currentSeason.weekendStage === 'postWeekend') return state;
      const qual = simulateQualifying(buildPerformanceInput(state.world, seed));
      const qualifyingPosition = scoreToGridPosition(qual.score);
      const interim: WeekendSummary = {
        venue: state.world.currentSeason.nextVenue,
        qualifyingPosition,
        racePosition: qualifyingPosition,
        pointsEarned: 0,
        notes: [`Qualifying score ${qual.score.toFixed(1)}`],
      };
      return {
        world: appendNews(
          {
            ...state.world,
            lastWeekend: interim,
            currentSeason: { ...state.world.currentSeason, weekendStage: 'race' },
          },
          `Qualified P${qualifyingPosition} at ${state.world.currentSeason.nextVenue}`,
          `Session delta ${qual.expectedDelta.toFixed(1)} vs expectation.`,
          ['qualifying'],
        ),
      };
    }),
  simulateRace: (seed = 202) =>
    set((state) => {
      const last = state.world.lastWeekend;
      if (!last) return state;

      const race = simulateRace(buildPerformanceInput(state.world, seed));
      const finish = raceScoreToFinish(race.score, last.qualifyingPosition);
      const points = pointsForFinish(finish);
      const summary: WeekendSummary = {
        ...last,
        racePosition: finish,
        pointsEarned: points,
        notes: [...last.notes, `Race score ${race.score.toFixed(1)}`],
      };

      const picked = pickEvent(state.world, seed);
      const maybeEvent = picked ? materializeEvent(picked, state.world.currentDate, seed) : null;
      const updated = appendNews(
        {
          ...state.world,
          lastWeekend: summary,
          inbox: maybeEvent ? [...state.world.inbox, maybeEvent] : state.world.inbox,
          confidence: clamp(state.world.confidence + (finish <= 5 ? 4 : finish >= 14 ? -4 : 0)),
          currentSeason: {
            ...state.world.currentSeason,
            weekendStage: 'postWeekend',
            round: Math.min(state.world.currentSeason.totalRounds, state.world.currentSeason.round + 1),
            playerPoints: state.world.currentSeason.playerPoints + points,
          },
        },
        `Race finish P${finish} at ${state.world.currentSeason.nextVenue}`,
        points > 0 ? `Scored ${points} points and triggered paddock reaction.` : 'No points, pressure is rising.',
        ['race'],
      );
      return { world: worldStateSchema.parse(updated) };
    }),
  simulateWeekend: (seed = 99) => {
    get().simulateQualifying(seed);
    get().simulateRace(seed + 1);
  },
  advanceSeasonPhase: () =>
    set((state) => {
      const current = state.world.currentSeason.phase;
      const phase = current === 'preseason' ? 'inSeason' : current === 'inSeason' ? 'postseason' : 'preseason';
      return { world: { ...state.world, currentSeason: { ...state.world.currentSeason, phase } } };
    }),
}));
