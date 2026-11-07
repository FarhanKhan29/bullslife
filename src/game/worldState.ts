/** Read-only snapshot of the world for HTML overlays (minimap). Updated by WorldScene. */
import type { MapDef } from './maps/types';

export interface WorldSnapshot {
  map: MapDef | null;
  me: { x: number; y: number } | null;
  others: { x: number; y: number }[];
}

export const worldState: WorldSnapshot = { map: null, me: null, others: [] };
