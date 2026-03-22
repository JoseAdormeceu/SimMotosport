import { z } from 'zod';

export const weekendStageSchema = z.enum(['idle', 'qualifying', 'race', 'postWeekend']);

export const seasonStateSchema = z.object({
  year: z.number().int(),
  category: z.enum(['karting', 'f4', 'f3', 'f2', 'f1']),
  round: z.number().int().min(1),
  totalRounds: z.number().int().min(1),
  playerPoints: z.number().int().min(0),
  championshipPosition: z.number().int().min(1),
  phase: z.enum(['preseason', 'inSeason', 'postseason']),
  weekendStage: weekendStageSchema,
  nextVenue: z.string(),
});

export type SeasonState = z.infer<typeof seasonStateSchema>;
export type WeekendStage = z.infer<typeof weekendStageSchema>;
