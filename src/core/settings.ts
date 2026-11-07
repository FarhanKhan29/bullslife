import { loadJSON, saveJSON } from './storage';
import { Emitter } from './emitter';

export interface Settings {
  sfxVolume: number; // 0..1
  music: boolean;
  quality: 'high' | 'low';
  zoom: number; // camera zoom
  showHints: boolean;
}

const DEFAULTS: Settings = { sfxVolume: 0.6, music: true, quality: 'high', zoom: 1, showHints: true };

let current: Settings = { ...DEFAULTS, ...loadJSON<Partial<Settings>>('bl.settings', {}) };
export const settingsEvents = new Emitter<{ change: (s: Settings) => void }>();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  saveJSON('bl.settings', current);
  settingsEvents.emit('change', current);
}
