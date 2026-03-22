import { z } from 'zod';

const stat = z.number().min(0).max(100);

export const driverSkillsSchema = z.object({
  rawPace: stat,
  qualifyingPace: stat,
  racePace: stat,
  tyreManagement: stat,
  wetWeather: stat,
  consistency: stat,
  racecraft: stat,
  starts: stat,
  adaptability: stat,
  pressureHandling: stat,
  feedbackQuality: stat,
  developmentInfluence: stat,
});

export const driverPersonalitySchema = z.object({
  aggression: stat,
  discipline: stat,
  confidence: stat,
  ego: stat,
  diplomacy: stat,
  honesty: stat,
  ruthlessness: stat,
  independence: stat,
  mediaSavvy: stat,
  loyalty: stat,
});

export const publicImageSchema = z.object({
  popularity: stat,
  respect: stat,
  controversy: stat,
  mystique: stat,
  authenticity: stat,
  villainAura: stat,
  superstarAura: stat,
});

export const driverProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  age: z.number().int().min(14).max(60),
  nationality: z.string().min(2),
  archetype: z.enum(['saint', 'villain', 'antihero', 'machine', 'prodigy', 'rebel']),
  traits: z.record(z.string(), stat).default({}),
  skills: driverSkillsSchema,
  personality: driverPersonalitySchema,
  values: z.record(z.string(), stat).default({}),
  publicImage: publicImageSchema,
  hiddenModifiers: z.record(z.string(), z.number()).default({}),
});

export type DriverProfile = z.infer<typeof driverProfileSchema>;
