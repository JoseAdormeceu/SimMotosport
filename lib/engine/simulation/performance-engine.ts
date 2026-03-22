import type { FormLabel, NarrativeArc } from '@/lib/schema';
import { clamp } from '../utils/clamps';
import { createSeededRng } from '../utils/random';

export interface PerformanceInput {
  seed: number;
  rawPace: number;
  qualifyingPace: number;
  racePace: number;
  consistency: number;
  pressureHandling: number;
  teamStrength: number;
  weatherVolatility: number;
  morale: number;
  confidence: number;
  form: FormLabel;
  narrativeArc: NarrativeArc;
}

export interface SessionResult {
  score: number;
  expectedDelta: number;
  mistakeRisk: number;
  incident: boolean;
}

export interface PerformanceResult {
  qualifying: SessionResult;
  race: SessionResult;
  overperformance: boolean;
  underperformance: boolean;
  notes: string[];
}

interface FormModifiers {
  consistencyDelta: number;
  mistakeRiskDelta: number;
  confidenceDelta: number;
}

function getFormModifiers(form: FormLabel, arc: NarrativeArc): FormModifiers {
  const baseByForm: Record<FormLabel, FormModifiers> = {
    improving: { consistencyDelta: 2, mistakeRiskDelta: -2, confidenceDelta: 1 },
    declining: { consistencyDelta: -2, mistakeRiskDelta: 2, confidenceDelta: -1 },
    consistent: { consistencyDelta: 1, mistakeRiskDelta: -1, confidenceDelta: 0 },
    volatile: { consistencyDelta: -1, mistakeRiskDelta: 2, confidenceDelta: 0 },
  };

  const byArc: Record<NarrativeArc, Partial<FormModifiers>> = {
    'breakout-run': { consistencyDelta: 1, confidenceDelta: 1 },
    slump: { consistencyDelta: -1, mistakeRiskDelta: 1 },
    'consistency-streak': { consistencyDelta: 1, mistakeRiskDelta: -1 },
    'pressure-building': { mistakeRiskDelta: 1, confidenceDelta: -1 },
    recovery: { consistencyDelta: 1 },
    neutral: {},
  };

  const base = baseByForm[form];
  const arcMod = byArc[arc];
  return {
    consistencyDelta: base.consistencyDelta + (arcMod.consistencyDelta ?? 0),
    mistakeRiskDelta: base.mistakeRiskDelta + (arcMod.mistakeRiskDelta ?? 0),
    confidenceDelta: base.confidenceDelta + (arcMod.confidenceDelta ?? 0),
  };
}

function maybeApplyIncident(score: number, mistakeRisk: number, seed: number): { score: number; incident: boolean } {
  const rng = createSeededRng(seed);
  const roll = rng.next() * 100;
  if (roll > mistakeRisk) return { score, incident: false };
  const penalty = 5 + rng.next() * 5;
  return { score: clamp(score - penalty, 0, 100), incident: true };
}

function makeScore(base: number, swing: number): number {
  return clamp(base + swing, 0, 100);
}

export function simulateQualifying(input: PerformanceInput): SessionResult {
  const form = getFormModifiers(input.form, input.narrativeArc);
  const rng = createSeededRng(input.seed * 17 + 3);
  const effectiveConsistency = clamp(input.consistency + form.consistencyDelta, 0, 100);
  const effectiveConfidence = clamp(input.confidence + form.confidenceDelta, 0, 100);

  const base = input.rawPace * 0.25 + input.qualifyingPace * 0.35 + input.teamStrength * 0.25 + effectiveConfidence * 0.1 + input.morale * 0.05;
  const swing = (rng.next() - 0.5) * (12 + input.weatherVolatility * 0.22);
  const rawScore = makeScore(base, swing);
  const expected = input.rawPace * 0.45 + input.teamStrength * 0.55;

  const mistakeRisk = clamp(28 - effectiveConsistency * 0.12 - input.pressureHandling * 0.08 + form.mistakeRiskDelta, 2, 50);
  const incidentApplied = maybeApplyIncident(rawScore, mistakeRisk, input.seed * 17 + 5);

  return {
    score: incidentApplied.score,
    expectedDelta: incidentApplied.score - expected,
    mistakeRisk,
    incident: incidentApplied.incident,
  };
}

export function simulateRace(input: PerformanceInput): SessionResult {
  const form = getFormModifiers(input.form, input.narrativeArc);
  const rng = createSeededRng(input.seed * 17 + 11);
  const effectiveConsistency = clamp(input.consistency + form.consistencyDelta, 0, 100);
  const effectiveConfidence = clamp(input.confidence + form.confidenceDelta, 0, 100);

  const base = input.rawPace * 0.2 + input.racePace * 0.35 + effectiveConsistency * 0.2 + input.teamStrength * 0.2 + input.pressureHandling * 0.05;
  const swing = (rng.next() - 0.5) * (14 + input.weatherVolatility * 0.28);
  const rawScore = makeScore(base, swing + (effectiveConfidence - input.confidence) * 0.12);
  const expected = input.racePace * 0.5 + input.teamStrength * 0.5;

  const mistakeRisk = clamp(34 - effectiveConsistency * 0.2 - input.pressureHandling * 0.12 + input.weatherVolatility * 0.09 + form.mistakeRiskDelta, 5, 65);
  const incidentApplied = maybeApplyIncident(rawScore, mistakeRisk, input.seed * 17 + 13);

  return {
    score: incidentApplied.score,
    expectedDelta: incidentApplied.score - expected,
    mistakeRisk,
    incident: incidentApplied.incident,
  };
}

export function simulatePerformance(input: PerformanceInput): PerformanceResult {
  const qualifying = simulateQualifying(input);
  const race = simulateRace(input);
  const combinedDelta = (qualifying.expectedDelta + race.expectedDelta) / 2;

  const notes: string[] = [];
  if (combinedDelta > 8) notes.push('outperformed machinery across the weekend');
  if (combinedDelta < -8) notes.push('underperformed versus car potential');
  if (!notes.length) notes.push('delivered close to baseline expectation');
  if (race.mistakeRisk >= 30) notes.push('high race volatility increased incident risk');
  if (race.incident) notes.push('an on-track incident compromised race execution');

  return {
    qualifying,
    race,
    overperformance: combinedDelta > 8,
    underperformance: combinedDelta < -8,
    notes,
  };
}

export function scoreToGridPosition(score: number): number {
  return clamp(Math.round(22 - score / 5), 1, 20);
}

export function raceScoreToFinish(score: number, qualifyingPosition: number): number {
  const pacePosition = scoreToGridPosition(score);
  return clamp(Math.round(pacePosition * 0.7 + qualifyingPosition * 0.3), 1, 20);
}

export function pointsForFinish(position: number): number {
  const table = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return table[position - 1] ?? 0;
}
