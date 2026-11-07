/**
 * Local moderation tools: mute, block, report, and session favorites.
 * These are LOCAL to this browser — they hide players for you only.
 */
import { loadJSON, saveJSON } from '../core/storage';
import { Emitter } from '../core/emitter';

export const moderationEvents = new Emitter<{ change: () => void }>();

const muted = new Set<string>(loadJSON<string[]>('bl.muted', [], 'session'));
const blocked = new Set<string>(loadJSON<string[]>('bl.blocked', [], 'session'));
const favorites = new Map<string, string>(loadJSON<[string, string][]>('bl.favorites', [], 'session'));

function persist() {
  saveJSON('bl.muted', [...muted], 'session');
  saveJSON('bl.blocked', [...blocked], 'session');
  saveJSON('bl.favorites', [...favorites], 'session');
  moderationEvents.emit('change');
}

export const isMuted = (id: string) => muted.has(id) || blocked.has(id);
export const isBlocked = (id: string) => blocked.has(id);
export const isFavorite = (id: string) => favorites.has(id);
export const listFavorites = () => [...favorites.entries()].map(([id, name]) => ({ id, name }));

export function toggleMute(id: string) {
  muted.has(id) ? muted.delete(id) : muted.add(id);
  persist();
}
export function toggleBlock(id: string) {
  blocked.has(id) ? blocked.delete(id) : blocked.add(id);
  persist();
}
export function toggleFavorite(id: string, name: string) {
  favorites.has(id) ? favorites.delete(id) : favorites.set(id, name);
  persist();
}

export interface Report {
  playerId: string;
  playerName: string;
  reason: string;
  details: string;
  room: string;
  at: string;
  recentMessages: string[];
}

/**
 * Saves a report locally. In this hackathon build there is no moderation
 * backend, so reports are NOT sent anywhere — the UI says so honestly.
 */
export function saveReport(r: Report) {
  const all = loadJSON<Report[]>('bl.reports', []);
  all.push(r);
  saveJSON('bl.reports', all.slice(-50));
}
