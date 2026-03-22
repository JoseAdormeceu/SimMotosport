import { z } from 'zod';

const relationMetric = z.number().min(-100).max(100);

export const relationshipStateSchema = z.object({
  id: z.string(),
  targetDriverId: z.string(),
  respect: relationMetric,
  trust: relationMetric,
  hostility: relationMetric,
  envy: relationMetric,
  admiration: relationMetric,
  closeness: relationMetric,
  politicalAlignment: relationMetric,
  label: z.enum(['ally', 'rival', 'neutral']),
});

export type RelationshipState = z.infer<typeof relationshipStateSchema>;
