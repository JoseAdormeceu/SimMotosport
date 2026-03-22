import { z } from 'zod';

export const contractStateSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  role: z.enum(['primary', 'reserve', 'academy']),
  startYear: z.number().int(),
  endYear: z.number().int(),
  salary: z.number().nonnegative(),
  buyoutClause: z.number().nonnegative().optional(),
  active: z.boolean(),
});

export type ContractState = z.infer<typeof contractStateSchema>;
