import type {
  DriverState,
  EmergentTraits,
  IntentCategory,
  IntentTarget,
  IntentTone,
  PendingConsequence,
  PlayerIntent,
  WorldAction,
  WorldActionResolution,
  WorldState,
} from '@/lib/schema';

export interface ParsedIntent {
  category: IntentCategory;
  tone: IntentTone;
  target: IntentTarget;
  targetDriverId?: string;
  tags: string[];
}

export interface ActionResolutionResult {
  action: WorldAction;
  world: WorldState;
}

const CATEGORY_RULES: Array<{ category: IntentCategory; words: string[] }> = [
  { category: 'training', words: ['train', 'practice', 'fitness', 'sim', 'prepare', 'learn', 'coach'] },
  { category: 'social', words: ['visit', 'meet', 'friend', 'rival', 'talk', 'apologize', 'argue', 'confront'] },
  { category: 'media', words: ['media', 'press', 'interview', 'headline', 'news', 'spin', 'leak'] },
  { category: 'lifestyle', words: ['rest', 'sleep', 'family', 'vacation', 'party', 'nightlife'] },
  { category: 'focus', words: ['focus', 'ignore', 'concentrate', 'mindset', 'discipline'] },
];

const TONE_RULES: Array<{ tone: IntentTone; words: string[] }> = [
  { tone: 'aggressive', words: ['aggressive', 'hard', 'push', 'attack', 'limits', 'dominate'] },
  { tone: 'risky', words: ['risky', 'gamble', 'bold', 'chance', 'danger', 'reckless'] },
  { tone: 'safe', words: ['safe', 'careful', 'steady', 'controlled', 'measured'] },
  { tone: 'relaxed', words: ['relaxed', 'calm', 'easy', 'recover', 'reset'] },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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

  if (text.includes('team') || text.includes('crew') || text.includes('engineer')) return { target: 'team' };
  if (text.includes('rival') || text.includes('opponent')) return { target: 'rival' };
  return { target: 'self' };
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function relationshipScore(state: WorldState, target: IntentTarget, targetDriverId?: string): number {
  if (target === 'team') return (state.teams[0]?.trustInPlayer ?? 50) / 2;

  if (target === 'rival' || target === 'specific-driver') {
    const relationship = state.relationships.find((item) =>
      target === 'specific-driver' && targetDriverId ? item.targetDriverId === targetDriverId : item.label === 'rival',
    );

    if (!relationship) return 10;
    return relationship.trust * 0.3 + relationship.respect * 0.2 - relationship.hostility * 0.2;
  }

  return 20;
}

function contextModifier(state: WorldState, parsed: ParsedIntent): number {
  const latestBand = state.recentPerformance[state.recentPerformance.length - 1]?.band;

  let modifier = 0;
  if (latestBand === 'overperformance') modifier += 2;
  if (latestBand === 'underperformance') modifier -= 2;

  if (state.narrativeArc === 'breakout-run') modifier += 2;
  if (state.narrativeArc === 'slump' || state.narrativeArc === 'pressure-building') modifier -= 3;

  if (state.player.publicImage.controversy > 65 && parsed.category === 'media') modifier -= 3;
  if (state.player.publicImage.controversy > 65 && parsed.category === 'focus') modifier -= 1;

  if (parsed.target === 'team' && (state.teams[0]?.trustInPlayer ?? 50) < 40) modifier -= 2;

  return modifier;
}

function memoryDifficultyModifier(state: WorldState, parsed: ParsedIntent): number {
  const similarActions = state.actionMemory.filter((item) => item.category === parsed.category).length;
  const riskyPatternCount = state.actionMemory.filter((item) => item.tone === 'risky').length;

  let modifier = similarActions >= 3 ? 3 : similarActions >= 1 ? 1 : 0;
  if (parsed.tone === 'risky') modifier += riskyPatternCount >= 2 ? 4 : 2;
  if (parsed.category === 'training' && similarActions >= 2) modifier -= 1;

  return modifier;
}

function capabilityScore(state: WorldState, parsed: ParsedIntent): number {
  const socialSkill = state.player.personality.diplomacy * 0.5 + state.player.personality.mediaSavvy * 0.3;
  const disciplineSkill = state.player.personality.discipline * 0.4 + state.player.skills.consistency * 0.4;

  if (parsed.category === 'training') {
    return state.player.skills.feedbackQuality * 0.25 + state.player.skills.adaptability * 0.25 + state.confidence * 0.2 + (state.teams[0]?.morale ?? 50) * 0.1;
  }

  if (parsed.category === 'social') {
    return socialSkill + relationshipScore(state, parsed.target, parsed.targetDriverId) * 0.35;
  }

  if (parsed.category === 'media') {
    return state.player.personality.mediaSavvy * 0.55 + state.player.publicImage.respect * 0.2 - state.player.publicImage.controversy * 0.15;
  }

  if (parsed.category === 'lifestyle') {
    return disciplineSkill + (100 - state.fia.scrutiny) * 0.1;
  }

  return state.confidence * 0.35 + disciplineSkill;
}

function textDifficulty(text: string): number {
  const hardWords = ['manipulate', 'threaten', 'blackmail', 'leak', 'party', 'risk', 'crash', 'sabotage', 'confront'];
  const keywordPressure = hardWords.reduce((score, word) => (text.includes(word) ? score + 8 : score), 0);
  const lengthPressure = Math.min(8, Math.floor(text.split(' ').length / 3));
  return 20 + keywordPressure + lengthPressure;
}

function toneModifier(tone: IntentTone): { score: number; volatility: number } {
  if (tone === 'aggressive') return { score: 2, volatility: 5 };
  if (tone === 'risky') return { score: -1, volatility: 8 };
  if (tone === 'relaxed') return { score: 1, volatility: 2 };
  return { score: 0, volatility: 1 };
}

function outcomeFromScore(score: number): WorldActionResolution {
  if (score >= 12) return 'success';
  if (score <= -8) return 'failure';
  return 'mixed';
}

function actionSummary(parsed: ParsedIntent, resolution: WorldActionResolution): string {
  const actionLabel = `${parsed.category} action targeting ${parsed.target === 'specific-driver' ? 'a specific driver' : parsed.target}`;

  if (resolution === 'success') return `${actionLabel} landed cleanly and improved your short-term narrative leverage.`;
  if (resolution === 'failure') return `${actionLabel} backfired, increasing pressure and creating narrative drag.`;
  return `${actionLabel} produced mixed fallout, opening some doors while adding friction elsewhere.`;
}

function updatedTraits(previous: EmergentTraits, parsed: ParsedIntent, resolution: WorldActionResolution): EmergentTraits {
  const bump = resolution === 'success' ? 2 : resolution === 'failure' ? 1 : 1.5;

  return {
    aggressive: clamp(previous.aggressive + (parsed.tone === 'aggressive' ? bump : -0.3), 0, 100),
    loyal: clamp(previous.loyal + (parsed.target === 'team' ? bump : -0.2), 0, 100),
    political: clamp(previous.political + (parsed.category === 'social' || parsed.category === 'media' ? bump : -0.2), 0, 100),
    reckless: clamp(previous.reckless + (parsed.tone === 'risky' ? bump * 1.2 : -0.3), 0, 100),
    mediaSavvy: clamp(previous.mediaSavvy + (parsed.category === 'media' ? bump : 0.1), 0, 100),
  };
}

function buildFollowUpConsequences(action: WorldAction, world: WorldState): PendingConsequence[] {
  const dueRound = Math.min(world.currentSeason.totalRounds, world.currentSeason.round + 1);
  const laterRound = Math.min(world.currentSeason.totalRounds, world.currentSeason.round + 2);

  const consequences: PendingConsequence[] = [];

  if (action.category === 'media') {
    consequences.push({
      id: `${action.id}-media`,
      sourceActionId: action.id,
      kind: 'media-reaction',
      dueRound,
      summary: 'Media cycle amplifies your recent action.',
      effects: {
        popularityDelta: action.resolution === 'success' ? 2 : -1,
        controversyDelta: action.resolution === 'failure' ? 2 : 1,
        teamTrustDelta: 0,
        moraleDelta: 0,
        relationshipTrustDelta: 0,
        marketValueDelta: action.resolution === 'success' ? 50000 : -15000,
        fiaScrutinyDelta: action.resolution === 'failure' ? 1 : 0,
      },
    });
  }

  if (action.target === 'team' || action.resolution === 'failure') {
    consequences.push({
      id: `${action.id}-team-pressure`,
      sourceActionId: action.id,
      kind: 'team-pressure',
      dueRound,
      summary: 'Internal team pressure rises in response to your off-track direction.',
      effects: {
        popularityDelta: 0,
        controversyDelta: action.resolution === 'failure' ? 1 : 0,
        teamTrustDelta: action.resolution === 'success' ? 1 : -2,
        moraleDelta: action.resolution === 'success' ? 1 : -2,
        relationshipTrustDelta: 0,
        marketValueDelta: 0,
        fiaScrutinyDelta: 0,
      },
    });
  }

  if (action.resolution === 'failure' || action.category === 'social') {
    consequences.push({
      id: `${action.id}-contract`,
      sourceActionId: action.id,
      kind: 'contract-ripple',
      dueRound: laterRound,
      summary: 'Market perception adjusts your contract leverage.',
      effects: {
        popularityDelta: 0,
        controversyDelta: 0,
        teamTrustDelta: 0,
        moraleDelta: 0,
        relationshipTrustDelta: 0,
        marketValueDelta: action.resolution === 'success' ? 80000 : -40000,
        fiaScrutinyDelta: 0,
      },
    });
  }

  return consequences;
}

export function applyPendingConsequences(world: WorldState): WorldState {
  const due = world.pendingConsequences.filter((item) => item.dueRound <= world.currentSeason.round);
  if (!due.length) return world;

  const relationshipDelta = due.reduce((sum, item) => sum + item.effects.relationshipTrustDelta, 0);

  const updated: WorldState = {
    ...world,
    player: {
      ...world.player,
      publicImage: {
        ...world.player.publicImage,
        popularity: clamp(world.player.publicImage.popularity + due.reduce((sum, item) => sum + item.effects.popularityDelta, 0), 0, 100),
        controversy: clamp(world.player.publicImage.controversy + due.reduce((sum, item) => sum + item.effects.controversyDelta, 0), 0, 100),
      },
    },
    teams: world.teams.map((team, index) =>
      index === 0
        ? {
            ...team,
            trustInPlayer: clamp(team.trustInPlayer + due.reduce((sum, item) => sum + item.effects.teamTrustDelta, 0), 0, 100),
            morale: clamp(team.morale + due.reduce((sum, item) => sum + item.effects.moraleDelta, 0), 0, 100),
          }
        : team,
    ),
    relationships: world.relationships.map((relationship, index) =>
      index === 0 ? { ...relationship, trust: clamp(relationship.trust + relationshipDelta, -100, 100) } : relationship,
    ),
    market: {
      value: Math.max(0, world.market.value + due.reduce((sum, item) => sum + item.effects.marketValueDelta, 0)),
    },
    fia: {
      scrutiny: clamp(world.fia.scrutiny + due.reduce((sum, item) => sum + item.effects.fiaScrutinyDelta, 0), 0, 100),
    },
    pendingConsequences: world.pendingConsequences.filter((item) => item.dueRound > world.currentSeason.round),
    history: [
      ...due.map((item) => ({
        id: `hist-followup-${item.id}`,
        text: `Follow-up consequence: ${item.summary}`,
        createdAt: world.currentDate,
      })),
      ...world.history,
    ].slice(0, 40),
  };

  return updated;
}

export function parseIntent(text: string, drivers: DriverState[]): ParsedIntent {
  const normalized = text.trim().toLowerCase();
  const category = detectCategory(normalized);
  const tone = detectTone(normalized);
  const targetResult = detectTarget(normalized, drivers);

  const tags = [category, tone, targetResult.target === 'specific-driver' ? 'specific driver' : targetResult.target, 'world-action'];

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

export function resolveWorldAction(world: WorldState, text: string, intent: PlayerIntent): ActionResolutionResult {
  const parsed = parseIntent(text, world.drivers);
  const normalized = text.trim().toLowerCase();
  const seed = hashString(`${world.currentDate}-${world.currentSeason.round}-${normalized}`);

  const baseCapability = capabilityScore(world, parsed);
  const difficulty = textDifficulty(normalized) + memoryDifficultyModifier(world, parsed);
  const tone = toneModifier(parsed.tone);
  const swing = ((seed % 21) - 10) * 0.8;

  const score = Math.round(
    baseCapability - difficulty + tone.score + swing + relationshipScore(world, parsed.target, parsed.targetDriverId) * 0.1 + contextModifier(world, parsed),
  );
  const resolution = outcomeFromScore(score);

  const confidenceDelta =
    parsed.category === 'training'
      ? resolution === 'success'
        ? 3
        : resolution === 'failure'
          ? -2
          : 1
      : resolution === 'success'
        ? 2
        : resolution === 'failure'
          ? -2
          : 0;

  const teamTrustDelta =
    parsed.target === 'team'
      ? resolution === 'success'
        ? 3
        : resolution === 'failure'
          ? -3
          : 1
      : resolution === 'failure'
        ? -1
        : 0;

  const popularityDelta =
    parsed.category === 'media'
      ? resolution === 'success'
        ? 4
        : resolution === 'failure'
          ? -2
          : 1
      : resolution === 'success'
        ? 1
        : 0;

  const controversyDelta =
    parsed.tone === 'risky' || parsed.category === 'media'
      ? resolution === 'success'
        ? 1
        : resolution === 'failure'
          ? 4
          : 2
      : resolution === 'failure'
        ? 1
        : 0;

  const relationshipTrustDelta =
    parsed.target === 'rival' || parsed.target === 'specific-driver'
      ? resolution === 'success'
        ? 3
        : resolution === 'failure'
          ? -4
          : 1
      : 0;

  const hostilityDelta =
    parsed.target === 'rival' || parsed.target === 'specific-driver'
      ? resolution === 'success'
        ? -2
        : resolution === 'failure'
          ? 4
          : 1
      : 0;

  const action: WorldAction = {
    id: `action-${seed}`,
    text,
    category: parsed.category,
    tone: parsed.tone,
    target: parsed.target,
    targetDriverId: parsed.targetDriverId,
    tags: [...parsed.tags, resolution],
    createdAt: world.currentDate,
    resolution,
    score,
    difficulty: Math.round(difficulty + tone.volatility),
    summary: actionSummary(parsed, resolution),
  };

  const followUps = buildFollowUpConsequences(action, world);

  const updatedWorld: WorldState = {
    ...world,
    confidence: clamp(world.confidence + confidenceDelta, 0, 100),
    player: {
      ...world.player,
      publicImage: {
        ...world.player.publicImage,
        popularity: clamp(world.player.publicImage.popularity + popularityDelta, 0, 100),
        controversy: clamp(world.player.publicImage.controversy + controversyDelta, 0, 100),
      },
    },
    teams: world.teams.map((team, index) =>
      index === 0
        ? {
            ...team,
            trustInPlayer: clamp(team.trustInPlayer + teamTrustDelta, 0, 100),
            morale: clamp(team.morale + (resolution === 'success' ? 1 : resolution === 'failure' ? -2 : 0), 0, 100),
          }
        : team,
    ),
    relationships: world.relationships.map((relationship) => {
      const targeted =
        parsed.target === 'specific-driver'
          ? relationship.targetDriverId === parsed.targetDriverId
          : parsed.target === 'rival'
            ? relationship.label === 'rival'
            : parsed.target === 'team'
              ? relationship.label === 'ally'
              : relationship.label === 'rival';

      if (!targeted) return relationship;

      return {
        ...relationship,
        trust: clamp(relationship.trust + relationshipTrustDelta, -100, 100),
        hostility: clamp(relationship.hostility + hostilityDelta, -100, 100),
      };
    }),
    history: [
      {
        id: `hist-action-${action.id}`,
        text: `World action (${action.resolution}): ${text}`,
        createdAt: world.currentDate,
      },
      ...world.history,
    ].slice(0, 40),
    lastAction: action,
    recentActions: [action, ...world.recentActions].slice(0, 8),
    actionMemory: [action, ...world.actionMemory].slice(0, 40),
    emergentTraits: updatedTraits(world.emergentTraits, parsed, resolution),
    pendingConsequences: [...world.pendingConsequences, ...followUps].slice(-20),
    flags: {
      ...world.flags,
      actionPressure: resolution === 'failure',
      actionHype: resolution === 'success' && (parsed.category === 'media' || parsed.category === 'training'),
      actionConflict: parsed.target === 'rival' && resolution !== 'success',
    },
  };

  return { action, world: updatedWorld };
}

export function applyIntentImmediateEffects(world: WorldState, intent: PlayerIntent): WorldState {
  const resolution = resolveWorldAction(world, intent.text, intent);
  return {
    ...resolution.world,
    playerIntent: {
      ...intent,
      active: resolution.action.resolution !== 'failure',
      tags: [...intent.tags, resolution.action.resolution],
    },
  };
}

export function intentPerformanceModifiers(intent: PlayerIntent | null): { consistency: number; confidence: number; mistakeRisk: number } {
  if (!intent || !intent.active) return { consistency: 0, confidence: 0, mistakeRisk: 0 };

  const consistency = intent.category === 'training' ? 2 : intent.category === 'lifestyle' ? 1 : 0;
  const confidence = intent.tone === 'aggressive' ? 2 : intent.tone === 'relaxed' ? 1 : 0;
  const mistakeRisk = intent.tone === 'risky' ? 2 : intent.tone === 'safe' ? -1 : 0;

  return { consistency, confidence, mistakeRisk };
}
