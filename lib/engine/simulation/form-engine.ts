import type { FormLabel, NarrativeArc, RecentPerformanceItem } from '@/lib/schema';

export interface FormAnalysis {
  form: FormLabel;
  arc: NarrativeArc;
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
}

function stdDev(values: number[]): number {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function classifyForm(history: RecentPerformanceItem[]): FormLabel {
  if (history.length < 3) return 'consistent';
  const finishes = history.map((entry) => entry.finishPosition);
  const firstHalf = average(finishes.slice(0, Math.ceil(finishes.length / 2)));
  const secondHalf = average(finishes.slice(-Math.ceil(finishes.length / 2)));
  const trend = firstHalf - secondHalf;
  const spread = stdDev(finishes);

  if (spread >= 4.5) return 'volatile';
  if (trend >= 2) return 'improving';
  if (trend <= -2) return 'declining';
  return 'consistent';
}

export function classifyNarrativeArc(history: RecentPerformanceItem[], form: FormLabel, controversy: number): NarrativeArc {
  if (!history.length) return 'neutral';

  const latest = history[history.length - 1];
  const lastThree = history.slice(-3);
  const overCount = lastThree.filter((item) => item.band === 'overperformance').length;
  const underCount = lastThree.filter((item) => item.band === 'underperformance').length;
  const avgFinish3 = average(lastThree.map((item) => item.finishPosition));

  if (overCount >= 2 && form === 'improving') return 'breakout-run';
  if (underCount >= 2 && form === 'declining') return 'slump';
  if (form === 'consistent' && stdDev(lastThree.map((item) => item.finishPosition)) < 1.6) return 'consistency-streak';
  if (form === 'declining' && controversy >= 55) return 'pressure-building';

  const hadSlumpThenLift = history.length >= 4 && history.slice(-4, -1).some((item) => item.band === 'underperformance') && latest.band === 'overperformance';
  if (hadSlumpThenLift || (form === 'improving' && latest.band !== 'underperformance')) return 'recovery';

  return 'neutral';
}

export function analyzeForm(history: RecentPerformanceItem[], controversy: number): FormAnalysis {
  const form = classifyForm(history);
  return {
    form,
    arc: classifyNarrativeArc(history, form, controversy),
  };
}
