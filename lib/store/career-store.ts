import { create } from 'zustand';
import type { Decision, EventDefinition, EventInstance, WorldState } from '@/lib/schema';
import { worldStateSchema } from '@/lib/schema';
import { pickEvent } from '@/lib/engine/simulation/event-engine';
import { simulatePerformance } from '@/lib/engine/simulation/performance-engine';
import { saveCareerToStorage } from '@/lib/persistence/local-storage';

interface CareerStore {
  world: WorldState;
  createCareer: (world: WorldState) => void;
  loadCareer: (world: WorldState) => void;
  saveCareer: () => void;
  advanceDay: () => void;
  enqueueEvent: (event: EventInstance) => void;
  applyEvent: (event: EventDefinition, seed?: number) => void;
  applyDecision: (decision: Decision) => void;
  simulateWeekend: (seed?: number) => void;
  advanceSeasonPhase: () => void;
}

const baseWorld: WorldState = {
  currentDate: '2026-03-21',
  currentCategory: 'f4',
  currentSeason: {
    year: 2026,
    category: 'f4',
    round: 1,
    totalRounds: 10,
    playerPoints: 0,
    championshipPosition: 12,
    phase: 'preseason',
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
  history: [],
  inbox: [],
  newsFeed: [],
  flags: {},
};

const validBaseWorld = worldStateSchema.parse(baseWorld);

export const useCareerStore = create<CareerStore>((set, get) => ({
  world: validBaseWorld,
  createCareer: (world) => set({ world: worldStateSchema.parse(world) }),
  loadCareer: (world) => set({ world: worldStateSchema.parse(world) }),
  saveCareer: () => saveCareerToStorage(get().world),
  advanceDay: () =>
    set((state) => {
      const date = new Date(state.world.currentDate);
      date.setUTCDate(date.getUTCDate() + 1);
      return { world: { ...state.world, currentDate: date.toISOString().slice(0, 10) } };
    }),
  enqueueEvent: (event) => set((state) => ({ world: { ...state.world, inbox: [...state.world.inbox, event] } })),
  applyEvent: (event, seed = 42) =>
    set((state) => {
      const instance: EventInstance = {
        id: `evt-${seed}-${state.world.inbox.length}`,
        definitionId: event.id,
        title: event.title,
        description: event.descriptionTemplate,
        choices: event.choices,
        createdAt: state.world.currentDate,
      };
      return { world: { ...state.world, inbox: [...state.world.inbox, instance] } };
    }),
  applyDecision: (decision) =>
    set((state) => {
      const event = state.world.inbox.find((item) => item.id === decision.eventInstanceId);
      if (!event) return state;
      const choice = event.choices.find((item) => item.id === decision.choiceId);
      if (!choice) return state;
      const { effects } = choice;
      const updated = {
        ...state.world,
        player: {
          ...state.world.player,
          publicImage: {
            ...state.world.player.publicImage,
            popularity: Math.max(0, Math.min(100, state.world.player.publicImage.popularity + effects.popularityDelta)),
            respect: Math.max(0, Math.min(100, state.world.player.publicImage.respect + effects.respectDelta)),
            controversy: Math.max(0, Math.min(100, state.world.player.publicImage.controversy + effects.controversyDelta)),
          },
        },
        fia: {
          scrutiny: Math.max(0, Math.min(100, state.world.fia.scrutiny + effects.fiaScrutinyDelta)),
        },
        inbox: state.world.inbox.filter((item) => item.id !== decision.eventInstanceId),
      };
      return { world: updated };
    }),
  simulateWeekend: (seed = 99) =>
    set((state) => {
      const perf = simulatePerformance({
        seed,
        skill: state.world.player.skills.rawPace,
        consistency: state.world.player.skills.consistency,
        pressureHandling: state.world.player.skills.pressureHandling,
        teamStrength: state.world.teams[0]?.carStrength ?? 50,
        weatherVolatility: 40,
        morale: state.world.teams[0]?.morale ?? 50,
      });
      const picked = pickEvent(state.world, seed);
      const news = {
        id: `news-${seed}-${state.world.newsFeed.length}`,
        headline: `Round ${state.world.currentSeason.round}: ${perf.notes[0]}`,
        summary: `Qualifying ${perf.qualifyingScore.toFixed(1)} / Race ${perf.raceScore.toFixed(1)}.`,
        tags: ['weekend'],
        createdAt: state.world.currentDate,
      };
      return {
        world: {
          ...state.world,
          inbox: picked
            ? [
                ...state.world.inbox,
                {
                  id: `evt-weekend-${seed}`,
                  definitionId: picked.id,
                  title: picked.title,
                  description: picked.descriptionTemplate,
                  choices: picked.choices,
                  createdAt: state.world.currentDate,
                },
              ]
            : state.world.inbox,
          newsFeed: [news, ...state.world.newsFeed].slice(0, 8),
          currentSeason: {
            ...state.world.currentSeason,
            round: Math.min(state.world.currentSeason.totalRounds, state.world.currentSeason.round + 1),
          },
        },
      };
    }),
  advanceSeasonPhase: () =>
    set((state) => {
      const current = state.world.currentSeason.phase;
      const phase = current === 'preseason' ? 'inSeason' : current === 'inSeason' ? 'postseason' : 'preseason';
      return { world: { ...state.world, currentSeason: { ...state.world.currentSeason, phase } } };
    }),
}));
