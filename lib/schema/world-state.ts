import { z } from 'zod';
import { contractStateSchema } from './contract';
import { driverProfileSchema } from './driver';
import { eventInstanceSchema } from './event';
import { newsItemSchema } from './news-item';
import { relationshipStateSchema } from './relationship';
import { seasonStateSchema } from './season';
import { teamStateSchema } from './team';

export const driverStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['karting', 'f4', 'f3', 'f2', 'f1']),
  overall: z.number().min(0).max(100),
});

export const weekendSummarySchema = z.object({
  venue: z.string(),
  qualifyingPosition: z.number().int().min(1),
  racePosition: z.number().int().min(1),
  pointsEarned: z.number().int().min(0),
  notes: z.array(z.string()),
});

export const worldStateSchema = z.object({
  currentDate: z.string(),
  currentCategory: z.enum(['karting', 'f4', 'f3', 'f2', 'f1']),
  currentSeason: seasonStateSchema,
  player: driverProfileSchema,
  teams: z.array(teamStateSchema),
  drivers: z.array(driverStateSchema),
  relationships: z.array(relationshipStateSchema),
  contracts: z.array(contractStateSchema),
  media: z.object({ sentiment: z.number().min(-100).max(100) }),
  fia: z.object({ scrutiny: z.number().min(0).max(100) }),
  fandom: z.object({ support: z.number().min(0).max(100) }),
  market: z.object({ value: z.number().min(0) }),
  confidence: z.number().min(0).max(100),
  history: z.array(z.object({ id: z.string(), text: z.string(), createdAt: z.string() })),
  inbox: z.array(eventInstanceSchema),
  newsFeed: z.array(newsItemSchema),
  lastWeekend: weekendSummarySchema.nullable(),
  flags: z.record(z.string(), z.boolean()),
});

export type DriverState = z.infer<typeof driverStateSchema>;
export type WeekendSummary = z.infer<typeof weekendSummarySchema>;
export type WorldState = z.infer<typeof worldStateSchema>;
