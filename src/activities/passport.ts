/** Campus Passport: collect a stamp inside every North Campus building. Saved in localStorage. */
import { loadJSON, saveJSON } from '../core/storage';
import { Emitter } from '../core/emitter';
import { BUILDINGS } from '../game/maps/buildings';

export type StampId = string; // building id

export const STAMPS: { id: StampId; name: string; emoji: string; hint: string; color: string }[] = BUILDINGS.filter((b) => b.passport !== false).map((b) => ({
  id: b.id,
  name: b.name,
  emoji: b.emoji,
  hint: b.blurb,
  color: b.color,
}));
export const STAMP_TOTAL = STAMPS.length;

type Stamps = Partial<Record<StampId, string>>;
let stamps: Stamps = loadJSON<Stamps>('bl.passport', {});
export const passportEvents = new Emitter<{ stamp: (id: StampId, all: Stamps) => void }>();

export function getStamps(): Stamps {
  return stamps;
}

/** Returns true if this is a NEW stamp. */
export function collectStamp(id: StampId): boolean {
  if (stamps[id] || !STAMPS.some((s) => s.id === id)) return false;
  stamps = { ...stamps, [id]: new Date().toISOString() };
  saveJSON('bl.passport', stamps);
  passportEvents.emit('stamp', id, stamps);
  return true;
}

export function stampCount(): number {
  return STAMPS.filter((s) => stamps[s.id]).length;
}
