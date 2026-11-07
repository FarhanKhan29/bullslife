import type { Appearance } from '../character/appearance';
import type { Facing } from '../character/avatarRenderer';
import type { MapId } from '../game/maps/types';

/** Data every player shares through Presence (low-frequency, "who is here"). */
export interface PlayerMeta {
  id: string;
  look: Appearance; // includes the nickname
  map: MapId;
  plate: 'A' | 'B' | null; // co-op pressure plate the player is standing on
  joinedAt: number;
}

/** High-frequency movement packet sent via Broadcast. */
export interface MovePacket {
  id: string;
  seq: number;
  x: number;
  y: number;
  f: Facing;
  fl: boolean; // flipX (facing left)
  m: boolean; // moving
  map: MapId;
  p?: number; // pose: 0 stand, 1 sit, 2 lie
  it?: number; // held item index (-1 = none)
}

export interface ChatPacket {
  id: string;
  mid: string; // message id (dedupe)
  text: string;
  t: number;
}

export interface EmotePacket {
  id: string;
  e: number;
}

export type NetStatus = 'connecting' | 'online' | 'offline' | 'error';

/**
 * A Transport is the raw pipe (Supabase Realtime or BroadcastChannel).
 * It knows nothing about the game.
 */
export interface Transport {
  readonly kind: 'supabase' | 'local';
  connect(room: string, meta: PlayerMeta): Promise<void>;
  updateMeta(meta: PlayerMeta): void;
  send(event: string, payload: Record<string, unknown>): void;
  disconnect(): Promise<void>;
  onPresence: (metas: PlayerMeta[]) => void;
  onEvent: (event: string, payload: Record<string, unknown>) => void;
  onStatus: (status: NetStatus) => void;
}
