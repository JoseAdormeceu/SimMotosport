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

export const recentPerformanceItemSchema = z.object({
  round: z.number().int().min(1),
  finishPosition: z.number().int().min(1),
  expectedPosition: z.number().int().min(1),
  points: z.number().int().min(0),
  band: z.enum(['overperformance', 'expected', 'underperformance']),
});

export const formLabelSchema = z.enum(['improving', 'declining', 'consistent', 'volatile']);
export const narrativeArcSchema = z.enum(['breakout-run', 'slump', 'consistency-streak', 'pressure-building', 'recovery', 'neutral']);

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
  recentPerformance: z.array(recentPerformanceItemSchema).max(5),
  form: formLabelSchema,
  narrativeArc: narrativeArcSchema,
  flags: z.record(z.string(), z.boolean()),
});

export type DriverState = z.infer<typeof driverStateSchema>;
export type WeekendSummary = z.infer<typeof weekendSummarySchema>;
export type RecentPerformanceItem = z.infer<typeof recentPerformanceItemSchema>;
export type FormLabel = z.infer<typeof formLabelSchema>;
export type NarrativeArc = z.infer<typeof narrativeArcSchema>;
export type WorldState = z.infer<typeof worldStateSchema>;
