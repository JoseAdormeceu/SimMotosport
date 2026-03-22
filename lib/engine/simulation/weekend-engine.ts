import { classifyPerformanceBand } from '@/lib/engine/generators/headline-generator';
import { materializeEvent, pickEvent } from '@/lib/engine/simulation/event-engine';
import {
  pointsForFinish,
  raceScoreToFinish,
  scoreToGridPosition,
  simulateQualifying,
  simulateRace,
  type PerformanceInput,
  type SessionResult,
} from '@/lib/engine/simulation/performance-engine';
import type { EventInstance, WeekendStage, WeekendSummary, WorldState } from '@/lib/schema';
import { analyzeForm } from './form-engine';
import { applyStandingsUpdate } from './season-engine';

const STAGE_TRANSITIONS: Record<WeekendStage, WeekendStage[]> = {
  idle: ['qualifying'],
  qualifying: ['race'],
  race: ['postWeekend'],
  postWeekend: ['idle'],
};

export interface TransitionResult {
  ok: boolean;
  world: WorldState;
  reason?: string;
}

export interface QualifyingSimulationResult extends TransitionResult {
  qualifyingResult?: SessionResult;
  qualifyingPosition?: number;
  expectedQualifyingPosition?: number;
}

export interface RaceSimulationResult extends TransitionResult {
  raceResult?: SessionResult;
  finishPosition?: number;
  expectedFinishPosition?: number;
  points?: number;
  spawnedEvent?: EventInstance | null;
}

export function assertStageTransition(current: WeekendStage, next: WeekendStage): boolean {
  return STAGE_TRANSITIONS[current].includes(next);
}

export function transitionWeekendStage(world: WorldState, nextStage: WeekendStage): TransitionResult {
  if (!assertStageTransition(world.currentSeason.weekendStage, nextStage)) {
    return {
      ok: false,
      reason: `Invalid weekend stage transition: ${world.currentSeason.weekendStage} -> ${nextStage}`,
      world,
    };
  }

  return {
    ok: true,
    world: {
      ...world,
      currentSeason: {
        ...world.currentSeason,
        weekendStage: nextStage,
      },
    },
  };
}

export function buildPerformanceInput(world: WorldState, seed: number): PerformanceInput {
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

export function simulateQualifyingStep(world: WorldState, seed: number): QualifyingSimulationResult {
  const transition = transitionWeekendStage(world, 'race');
  if (!transition.ok && world.currentSeason.weekendStage !== 'qualifying' && world.currentSeason.weekendStage !== 'idle') {
    return transition;
  }

  const stageFixedWorld =
    world.currentSeason.weekendStage === 'idle'
      ? { ...world, currentSeason: { ...world.currentSeason, weekendStage: 'qualifying' as WeekendStage } }
      : world;

  const perfInput = buildPerformanceInput(stageFixedWorld, seed);
  const qualifyingResult = simulateQualifying(perfInput);
  const qualifyingPosition = scoreToGridPosition(qualifyingResult.score);
  const expectedQualifyingPosition = scoreToGridPosition(perfInput.rawPace * 0.45 + perfInput.teamStrength * 0.55);
  const summary: WeekendSummary = {
    venue: world.currentSeason.nextVenue,
    qualifyingPosition,
    racePosition: qualifyingPosition,
    pointsEarned: 0,
    notes: [`Qualifying score ${qualifyingResult.score.toFixed(1)}`],
  };

  return {
    ok: true,
    qualifyingResult,
    qualifyingPosition,
    expectedQualifyingPosition,
    world: {
      ...stageFixedWorld,
      lastWeekend: summary,
      currentSeason: {
        ...stageFixedWorld.currentSeason,
        weekendStage: 'race',
      },
    },
  };
}

export function confidenceDeltaForFinish(finish: number): number {
  if (finish <= 3) return 6;
  if (finish <= 6) return 3;
  if (finish >= 18) return -8;
  if (finish >= 14) return -4;
  return 0;
}

export function simulateRaceStep(world: WorldState, seed: number): RaceSimulationResult {
  if (!world.lastWeekend) {
    return { ok: false, reason: 'Race simulation requires qualifying summary', world };
  }

  if (world.currentSeason.weekendStage !== 'race' && world.currentSeason.weekendStage !== 'qualifying') {
    return { ok: false, reason: `Race simulation not allowed from stage ${world.currentSeason.weekendStage}`, world };
  }

  const perfInput = buildPerformanceInput(world, seed);
  const raceResult = simulateRace(perfInput);
  const expectedBasePosition = scoreToGridPosition(perfInput.racePace * 0.5 + perfInput.teamStrength * 0.5);
  const expectedFinishPosition = raceScoreToFinish(perfInput.racePace * 0.5 + perfInput.teamStrength * 0.5, world.lastWeekend.qualifyingPosition);
  const finishPosition = raceScoreToFinish(raceResult.score, world.lastWeekend.qualifyingPosition);
  const points = pointsForFinish(finishPosition);

  const summary: WeekendSummary = {
    ...world.lastWeekend,
    racePosition: finishPosition,
    pointsEarned: points,
    notes: [...world.lastWeekend.notes, `Race score ${raceResult.score.toFixed(1)}`],
  };


  const band = classifyPerformanceBand(finishPosition, Math.round((expectedFinishPosition + expectedBasePosition) / 2));
  const recentPerformance = [
    ...world.recentPerformance,
    {
      round: world.currentSeason.round,
      finishPosition,
      expectedPosition: Math.round((expectedFinishPosition + expectedBasePosition) / 2),
      points,
      band,
    },
  ].slice(-5);
  const formAnalysis = analyzeForm(recentPerformance, world.player.publicImage.controversy);

  const standings = applyStandingsUpdate(world, points);
  const picked = pickEvent(world, seed);
  const spawnedEvent = picked ? materializeEvent(picked, world.currentDate, seed) : null;

  return {
    ok: true,
    raceResult,
    finishPosition,
    expectedFinishPosition: Math.round((expectedFinishPosition + expectedBasePosition) / 2),
    points,
    spawnedEvent,
    world: {
      ...standings.world,
      confidence: Math.max(0, Math.min(100, world.confidence + confidenceDeltaForFinish(finishPosition))),
      inbox: spawnedEvent ? [...world.inbox, spawnedEvent] : world.inbox,
      lastWeekend: summary,
      recentPerformance,
      form: formAnalysis.form,
      narrativeArc: formAnalysis.arc,
      currentSeason: {
        ...standings.world.currentSeason,
        weekendStage: 'postWeekend',
      },
    },
  };
}
