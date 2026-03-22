import { z } from 'zod';

export const newsItemSchema = z.object({
  id: z.string(),
  headline: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

export type NewsItem = z.infer<typeof newsItemSchema>;
