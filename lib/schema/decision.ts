import { z } from 'zod';

export const decisionSchema = z.object({
  id: z.string(),
  eventInstanceId: z.string(),
  choiceId: z.string(),
  decidedAt: z.string(),
});

export type Decision = z.infer<typeof decisionSchema>;
