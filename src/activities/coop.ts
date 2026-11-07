/**
 * Co-op "Team Switches" near Davis Hall.
 * Two DIFFERENT players must stand on plate A and plate B at the same time.
 * Every client derives the result from the shared Presence state (which
 * plate each player reports), so no single client decides it alone.
 */
import type { MapId } from '../game/maps/types';

export interface PlateEntry {
  id: string;
  map: MapId;
  plate: 'A' | 'B' | null;
}

export function plateOccupants(entries: PlateEntry[]) {
  const onA = entries.filter((e) => e.map === 'campus' && e.plate === 'A').map((e) => e.id);
  const onB = entries.filter((e) => e.map === 'campus' && e.plate === 'B').map((e) => e.id);
  return { onA, onB };
}

/** Solved when some player on A and a different player on B exist. */
export function isCoopSolved(entries: PlateEntry[]): boolean {
  const { onA, onB } = plateOccupants(entries);
  return onA.some((a) => onB.some((b) => b !== a));
}

export const PORTAL_OPEN_MS = 60_000;
