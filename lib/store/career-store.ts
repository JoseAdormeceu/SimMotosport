import { create } from 'zustand';
import { applyDecisionEffects, appendNews, clampCriticalState } from '@/lib/engine/simulation/career-engine';
import { createNewsId, createRaceHeadline } from '@/lib/engine/generators/headline-generator';
import { materializeEvent } from '@/lib/engine/simulation/event-engine';
import { simulateQualifyingStep, simulateRaceStep, transitionWeekendStage } from '@/lib/engine/simulation/weekend-engine';
import type { Decision, EventDefinition, EventInstance, WorldState } from '@/lib/schema';
import { worldStateSchema } from '@/lib/schema';
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

  return clampCriticalState(worldStateSchema.parse({ ...template, ...base }));
}

const initialWorld = withDefaults();

export const useCareerStore = create<CareerStore>((set, get) => ({
  world: initialWorld,
  createCareer: (input) =>
    set(() => ({
      world: withDefaults({
        player: {
          ...initialWorld.player,
          id: `player-${(input.seed ?? 1) + 1}`,
          name: input.name,
          nationality: input.nationality,
          archetype: input.archetype,
        },
      }),
    })),
  loadCareer: (world) => set({ world: clampCriticalState(worldStateSchema.parse(world)) }),
  saveCareer: () => saveCareerToStorage(get().world),
  advanceDay: () =>
    set((state) => {
      const date = new Date(state.world.currentDate);
      date.setUTCDate(date.getUTCDate() + 1);

      const stageTarget =
        state.world.currentSeason.weekendStage === 'idle'
          ? 'qualifying'
          : state.world.currentSeason.weekendStage === 'qualifying'
            ? 'race'
            : state.world.currentSeason.weekendStage === 'race'
              ? 'postWeekend'
              : 'idle';

      const transition = transitionWeekendStage(state.world, stageTarget);
      if (!transition.ok) return state;

      return {
        world: {
          ...transition.world,
          currentDate: date.toISOString().slice(0, 10),
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
      const result = applyDecisionEffects(state.world, event, decision.choiceId);
      if (!result.ok) return state;
      return { world: result.world };
    }),
  simulateQualifying: (seed = 101) =>
    set((state) => {
      const result = simulateQualifyingStep(state.world, seed);
      if (!result.ok || !result.qualifyingResult || !result.qualifyingPosition) return state;

      const roundTag = `round-${state.world.currentSeason.round}`;
      return {
        world: appendNews(result.world, {
          id: createNewsId('qualifying', state.world.currentSeason.round, seed),
          headline: `Qualified P${result.qualifyingPosition} at ${state.world.currentSeason.nextVenue}`,
          summary: `Session delta ${result.qualifyingResult.expectedDelta.toFixed(1)} vs expectation.`,
          tags: ['qualifying', roundTag],
          createdAt: state.world.currentDate,
        }),
      };
    }),
  simulateRace: (seed = 202) =>
    set((state) => {
      const result = simulateRaceStep(state.world, seed);
      if (!result.ok || !result.raceResult || !result.finishPosition || result.points === undefined) return state;

      const round = state.world.currentSeason.round;
      const raceHeadline = createRaceHeadline({
        seed,
        round,
        venue: state.world.currentSeason.nextVenue,
        driver: state.world.player.name,
        finishPosition: result.finishPosition,
        expectedPosition: result.expectedFinishPosition ?? result.finishPosition,
        reputation: state.world.player.publicImage.respect,
        recentForm: 100 - state.world.currentSeason.championshipPosition * 4,
        controversy: state.world.player.publicImage.controversy,
      });

      return {
        world: appendNews(clampCriticalState(result.world), {
          id: createNewsId('race', round, seed),
          headline: raceHeadline.headline,
          summary:
            result.points > 0
              ? `Scored ${result.points} points (${raceHeadline.band}, ${raceHeadline.tone} tone).`
              : `No points scored (${raceHeadline.band}, ${raceHeadline.tone} tone).`,
          tags: ['race', 'race-primary', `round-${round}`, `tone-${raceHeadline.tone}`, `band-${raceHeadline.band}`],
          createdAt: state.world.currentDate,
        }),
      };
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
