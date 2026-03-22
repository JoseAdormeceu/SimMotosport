import { headlineTemplates } from '@/lib/data/templates/headlines';
import { createSeededRng } from '@/lib/engine/utils/random';

export type HeadlineTone = 'neutral' | 'praise' | 'criticism' | 'hype';
export type PerformanceBand = 'overperformance' | 'expected' | 'underperformance';

export interface RaceHeadlineContext {
  seed: number;
  round: number;
  venue: string;
  driver: string;
  finishPosition: number;
  expectedPosition: number;
  reputation: number;
  recentForm: number;
  controversy: number;
}

function choose<T>(items: readonly T[], seed: number): T {
  const rng = createSeededRng(seed);
  const index = Math.floor(rng.next() * items.length);
  return items[index];
}

export function classifyPerformanceBand(finishPosition: number, expectedPosition: number): PerformanceBand {
  const delta = expectedPosition - finishPosition;
  if (delta >= 3) return 'overperformance';
  if (delta <= -3) return 'underperformance';
  return 'expected';
}

export function selectHeadlineTone(context: RaceHeadlineContext, band: PerformanceBand): HeadlineTone {
  if (context.controversy >= 70 && band !== 'overperformance') return 'criticism';
  if (band === 'overperformance' && context.reputation >= 60 && context.recentForm >= 60) return 'hype';
  if (band === 'underperformance' && context.recentForm < 45) return 'criticism';
  if (band === 'expected' && context.reputation >= 65) return 'praise';
  if (context.controversy >= 50 && band === 'overperformance') return 'hype';
  return 'neutral';
}

function fillTemplate(template: string, context: RaceHeadlineContext): string {
  return template
    .replaceAll('{driver}', context.driver)
    .replaceAll('{finish}', String(context.finishPosition))
    .replaceAll('{venue}', context.venue);
}

export function createRaceHeadline(context: RaceHeadlineContext): {
  headline: string;
  tone: HeadlineTone;
  band: PerformanceBand;
} {
  const band = classifyPerformanceBand(context.finishPosition, context.expectedPosition);
  const tone = selectHeadlineTone(context, band);

  const pool = headlineTemplates[band][tone] ?? headlineTemplates[band].neutral;
  const template = choose(pool, context.seed + context.round * 101);

  return {
    headline: fillTemplate(template, context),
    tone,
    band,
  };
}

export function createNewsId(kind: 'race' | 'qualifying' | 'decision', round: number, seed: number): string {
  return `news-${kind}-r${round}-s${seed}`;
}
