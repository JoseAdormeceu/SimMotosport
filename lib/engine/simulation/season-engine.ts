import type { WorldState } from '@/lib/schema';
import { clamp } from '../utils/clamps';

export interface StandingsUpdateResult {
  world: WorldState;
  pointsAwarded: number;
  estimatedChampionshipPosition: number;
}

export function estimateChampionshipPosition(points: number, round: number): number {
  const pressureBaseline = Math.max(1, 18 - round);
  return clamp(Math.round(pressureBaseline - points / 9), 1, 20);
}

export function applyStandingsUpdate(world: WorldState, pointsAwarded: number): StandingsUpdateResult {
  const nextPoints = world.currentSeason.playerPoints + pointsAwarded;
  const nextRound = Math.min(world.currentSeason.totalRounds, world.currentSeason.round + 1);
  const estimatedChampionshipPosition = estimateChampionshipPosition(nextPoints, nextRound);

  return {
    pointsAwarded,
    estimatedChampionshipPosition,
    world: {
      ...world,
      currentSeason: {
        ...world.currentSeason,
        round: nextRound,
        playerPoints: nextPoints,
        championshipPosition: estimatedChampionshipPosition,
      },
    },
  };
}
