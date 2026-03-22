import type { WorldState } from '@/lib/schema';

export const serializeWorldState = (state: WorldState) => JSON.stringify(state);
export const deserializeWorldState = (raw: string) => JSON.parse(raw) as WorldState;
