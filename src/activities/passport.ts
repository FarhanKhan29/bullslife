/** Campus Passport: collect a stamp at each landmark. Saved in localStorage. */
import { loadJSON, saveJSON } from '../core/storage';
import { Emitter } from '../core/emitter';

export type StampId = 'union' | 'capen' | 'davis';
export const STAMPS: { id: StampId; name: string; emoji: string; hint: string; color: string }[] = [
  { id: 'union', name: 'Student Union', emoji: '🏛️', hint: 'Check in at the Welcome Desk inside.', color: '#005bbb' },
  { id: 'capen', name: 'Capen Hall', emoji: '📚', hint: 'Read the plaque by the library entrance.', color: '#b9785a' },
  { id: 'davis', name: 'Davis Hall', emoji: '⚙️', hint: 'Read the plaque outside the engineering building.', color: '#3e7aa8' },
];

type Stamps = Partial<Record<StampId, string>>;
let stamps: Stamps = loadJSON<Stamps>('bl.passport', {});
export const passportEvents = new Emitter<{ stamp: (id: StampId, all: Stamps) => void }>();

export function getStamps(): Stamps {
  return stamps;
}

/** Returns true if this is a NEW stamp. */
export function collectStamp(id: StampId): boolean {
  if (stamps[id]) return false;
  stamps = { ...stamps, [id]: new Date().toISOString() };
  saveJSON('bl.passport', stamps);
  passportEvents.emit('stamp', id, stamps);
  return true;
}

export function stampCount(): number {
  return STAMPS.filter((s) => stamps[s.id]).length;
}
