import type { EffectBundle } from '@/lib/schema';

export interface ReactionSnapshot {
  fans: number;
  media: number;
  fia: number;
  playerTeam: number;
  rivalDriver: number;
  allyDriver: number;
}

export function generateReactions(effects: EffectBundle): ReactionSnapshot {
  return {
    fans: effects.popularityDelta * 1.2 - effects.controversyDelta * 0.5,
    media: effects.controversyDelta * 1.1 + effects.respectDelta * 0.4,
    fia: effects.fiaScrutinyDelta,
    playerTeam: effects.teamTrustDelta + effects.respectDelta * 0.3,
    rivalDriver: -effects.relationshipDelta * 0.5 + effects.controversyDelta * 0.4,
    allyDriver: effects.relationshipDelta * 0.8 + effects.respectDelta * 0.2,
  };
}
