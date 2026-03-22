import type { DriverState, IntentCategory, IntentTarget, IntentTone, PlayerIntent, WorldState } from '@/lib/schema';

export interface ParsedIntent {
  category: IntentCategory;
  tone: IntentTone;
  target: IntentTarget;
  targetDriverId?: string;
  tags: string[];
}

const CATEGORY_RULES: Array<{ category: IntentCategory; words: string[] }> = [
  { category: 'training', words: ['train', 'practice', 'fitness', 'sim', 'prepare'] },
  { category: 'social', words: ['visit', 'meet', 'friend', 'rival', 'talk'] },
  { category: 'media', words: ['media', 'press', 'interview', 'headline', 'news'] },
  { category: 'lifestyle', words: ['rest', 'sleep', 'family', 'vacation', 'calm'] },
  { category: 'focus', words: ['focus', 'ignore', 'concentrate', 'mindset'] },
];

const TONE_RULES: Array<{ tone: IntentTone; words: string[] }> = [
  { tone: 'aggressive', words: ['aggressive', 'hard', 'push', 'attack', 'limits'] },
  { tone: 'risky', words: ['risky', 'gamble', 'bold', 'chance'] },
  { tone: 'safe', words: ['safe', 'careful', 'steady', 'controlled'] },
  { tone: 'relaxed', words: ['relaxed', 'calm', 'easy', 'recover'] },
];

function scoreMatch(text: string, words: string[]): number {
  return words.reduce((score, word) => (text.includes(word) ? score + 1 : score), 0);
}

function detectCategory(text: string): IntentCategory {
  const best = CATEGORY_RULES
    .map((rule) => ({ category: rule.category, score: scoreMatch(text, rule.words) }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.category : 'focus';
}

function detectTone(text: string): IntentTone {
  const best = TONE_RULES
    .map((rule) => ({ tone: rule.tone, score: scoreMatch(text, rule.words) }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.tone : 'safe';
}

function detectTarget(text: string, drivers: DriverState[]): Pick<ParsedIntent, 'target' | 'targetDriverId'> {
  const match = drivers.find((driver) => text.includes(driver.name.toLowerCase()));
  if (match) return { target: 'specific-driver', targetDriverId: match.id };

  if (text.includes('team') || text.includes('crew')) return { target: 'team' };
  if (text.includes('rival')) return { target: 'rival' };
  return { target: 'self' };
}

export function parseIntent(text: string, drivers: DriverState[]): ParsedIntent {
  const normalized = text.trim().toLowerCase();
  const category = detectCategory(normalized);
  const tone = detectTone(normalized);
  const targetResult = detectTarget(normalized, drivers);

  const tags = [category, tone, targetResult.target === 'specific-driver' ? 'specific driver' : targetResult.target];

  return {
    category,
    tone,
    target: targetResult.target,
    targetDriverId: targetResult.targetDriverId,
    tags,
  };
}

export function buildIntent(text: string, world: WorldState): PlayerIntent {
  const parsed = parseIntent(text, world.drivers);
  return {
    text,
    category: parsed.category,
    tone: parsed.tone,
    target: parsed.target,
    targetDriverId: parsed.targetDriverId,
    tags: parsed.tags,
    submittedAt: world.currentDate,
    active: true,
  };
}

export function applyIntentImmediateEffects(world: WorldState, intent: PlayerIntent): WorldState {
  const confidenceDelta = intent.category === 'training' ? 2 : intent.category === 'focus' ? 1 : 0;
  const trustDelta = intent.target === 'team' ? 2 : intent.target === 'self' ? 0 : -1;
  const relationshipDelta = intent.target === 'rival' || intent.target === 'specific-driver' ? 2 : 0;

  return {
    ...world,
    confidence: Math.max(0, Math.min(100, world.confidence + confidenceDelta)),
    teams: world.teams.map((team, index) =>
      index === 0 ? { ...team, trustInPlayer: Math.max(0, Math.min(100, team.trustInPlayer + trustDelta)) } : team,
    ),
    relationships: world.relationships.map((rel, index) =>
      index === 0 ? { ...rel, trust: Math.max(-100, Math.min(100, rel.trust + relationshipDelta)) } : rel,
    ),
    playerIntent: intent,
  };
}

export function intentPerformanceModifiers(intent: PlayerIntent | null): { consistency: number; confidence: number; mistakeRisk: number } {
  if (!intent || !intent.active) return { consistency: 0, confidence: 0, mistakeRisk: 0 };

  const consistency = intent.category === 'training' ? 2 : intent.category === 'lifestyle' ? 1 : 0;
  const confidence = intent.tone === 'aggressive' ? 2 : intent.tone === 'relaxed' ? 1 : 0;
  const mistakeRisk = intent.tone === 'risky' ? 2 : intent.tone === 'safe' ? -1 : 0;

  return { consistency, confidence, mistakeRisk };
}
