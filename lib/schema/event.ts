import { z } from 'zod';

export const effectBundleSchema = z.object({
  popularityDelta: z.number().default(0),
  respectDelta: z.number().default(0),
  controversyDelta: z.number().default(0),
  teamTrustDelta: z.number().default(0),
  fiaScrutinyDelta: z.number().default(0),
  relationshipDelta: z.number().default(0),
  moraleDelta: z.number().default(0),
  confidenceDelta: z.number().default(0),
  marketValueDelta: z.number().default(0),
});

export const eventChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  tone: z.enum(['calm', 'aggressive', 'political', 'honest', 'deflective', 'diplomatic']),
  effects: effectBundleSchema,
  followupEventIds: z.array(z.string()).optional(),
});

export const eventDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  trigger: z.object({
    minRound: z.number().int().min(1).optional(),
    maxFiaScrutiny: z.number().max(100).optional(),
    minControversy: z.number().min(0).optional(),
  }),
  weight: z.number().positive(),
  tags: z.array(z.string()),
  descriptionTemplate: z.string(),
  choices: z.array(eventChoiceSchema).min(1),
  aiNarrationPromptKey: z.string().optional(),
});

export const eventInstanceSchema = z.object({
  id: z.string(),
  definitionId: z.string(),
  title: z.string(),
  description: z.string(),
  choices: z.array(eventChoiceSchema),
  createdAt: z.string(),
});

export type EventDefinition = z.infer<typeof eventDefinitionSchema>;
export type EventInstance = z.infer<typeof eventInstanceSchema>;
export type EffectBundle = z.infer<typeof effectBundleSchema>;
