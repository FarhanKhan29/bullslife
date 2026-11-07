/**
 * Global configuration. Only PUBLIC (publishable) values are read from the env.
 * If Supabase is not configured the game falls back to "local mode":
 * multiplayer between browser tabs on the same device via BroadcastChannel.
 */
export const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
export const SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
export const SUPABASE_PRIVATE_CHANNELS = import.meta.env.VITE_SUPABASE_PRIVATE_CHANNELS === 'true';

export const ONLINE_ENABLED =
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

/** Isometric tile size in pixels (diamond width / height). */
export const TILE_W = 64;
export const TILE_H = 32;

/** Networking tuning. */
export const NET = {
  moveSendIntervalMs: 100, // max 10 movement packets / second while walking
  idleHeartbeatMs: 4000, // re-send position while standing still
  staleRemoveMs: 20000, // drop players we stopped hearing from (and who left presence)
};

/** Chat safety limits. */
export const CHAT = {
  maxLength: 140,
  minIntervalMs: 800,
  burstWindowMs: 10000,
  burstMax: 5,
  bubbleMs: 5000,
  historyMax: 80,
};

export const DEFAULT_ROOM = 'north-campus';
