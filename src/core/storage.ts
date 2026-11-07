/** Safe wrappers around localStorage / sessionStorage (they can throw in private mode). */
export function loadJSON<T>(key: string, fallback: T, store: 'local' | 'session' = 'local'): T {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown, store: 'local' | 'session' = 'local'): void {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** A per-tab guest id (sessionStorage survives refresh, so reconnects keep the same id). */
export function getGuestId(): string {
  const existing = loadJSON<string | null>('bl.guestId', null, 'session');
  if (existing && /^[a-z0-9]{8,32}$/.test(existing)) return existing;
  const id = randomId(12);
  saveJSON('bl.guestId', id, 'session');
  return id;
}

export function randomId(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}
