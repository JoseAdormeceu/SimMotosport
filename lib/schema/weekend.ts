import { z } from 'zod';

export const weekendResultSchema = z.object({
  venue: z.string(),
  qualifyingRank: z.number().int().min(1),
  raceFinish: z.number().int().min(1),
  notes: z.array(z.string()),
});

export type WeekendResult = z.infer<typeof weekendResultSchema>;
