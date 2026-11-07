/**
 * Shared game session: the single place that connects UI overlays, the Phaser
 * scene and the network. UI and scene talk through `bus` events instead of
 * importing each other.
 */
import { loadAppearance, saveAppearance, type Appearance } from '../character/appearance';
import { Emitter } from './emitter';
import { getGuestId } from './storage';
import { DEFAULT_ROOM } from './config';
import { Multiplayer } from '../net/multiplayer';
import type { MapId } from '../game/maps/types';

export type Bus = {
  /** Contextual hint near the bottom of the screen (null = hide). */
  prompt: (text: string | null) => void;
  toast: (text: string, kind?: 'info' | 'success' | 'warn') => void;
  location: (map: MapId, name: string) => void;
  appearance: (a: Appearance) => void;
  /** UI → scene */
  localChat: (text: string) => void;
  localEmote: (e: number) => void;
  photo: () => void;
  /** UI → scene: same as pressing E (used by the on-screen prompt button). */
  interact: () => void;
  openPanel: (panel: 'passport' | 'friends' | 'character' | 'settings' | 'menu') => void;
  /** game → UI: modal info card */
  info: (text: string) => void;
  coop: (state: { a: boolean; b: boolean; open: boolean; remaining: number }) => void;
};

export const bus = new Emitter<Bus>();

const loaded = loadAppearance();

export const session = {
  appearance: loaded.appearance,
  isNewPlayer: loaded.isNew,
  room: sanitizeRoom(new URLSearchParams(location.search).get('room')) ?? DEFAULT_ROOM,
  playing: false,
  net: null as Multiplayer | null,
};

export function sanitizeRoom(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const r = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  return r.length >= 3 ? r : null;
}

export function setAppearance(a: Appearance) {
  session.appearance = a;
  saveAppearance(a);
  session.isNewPlayer = false;
  session.net?.updateMeta({ look: a });
  bus.emit('appearance', a);
}

export function getNet(): Multiplayer {
  if (!session.net) {
    session.net = new Multiplayer({
      id: getGuestId(),
      look: session.appearance,
      map: 'campus',
      plate: null,
      joinedAt: Date.now(),
    });
  }
  return session.net;
}

export function inviteLink(room = session.room): string {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', room);
  return url.toString();
}

export async function switchRoom(room: string) {
  session.room = room;
  const url = new URL(location.href);
  if (room === DEFAULT_ROOM) url.searchParams.delete('room');
  else url.searchParams.set('room', room);
  history.replaceState(null, '', url);
  if (session.playing) await getNet().connect(room);
}
