import { z } from 'zod';

export const teamStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['karting', 'f4', 'f3', 'f2', 'f1']),
  carStrength: z.number().min(0).max(100),
  morale: z.number().min(0).max(100),
  trustInPlayer: z.number().min(0).max(100),
});

export type TeamState = z.infer<typeof teamStateSchema>;
