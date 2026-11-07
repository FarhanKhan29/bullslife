/**
 * Client-side chat safety helpers.
 * IMPORTANT: these run in the browser, so they protect honest clients only.
 * A modified client can bypass them. Real moderation needs a server
 * (see README → "Safety limitations").
 */
import { CHAT } from '../core/config';

// A tiny mask list. Keep it short — this is a courtesy filter, not moderation.
const BLOCKED_WORDS = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard', 'whore', 'slut'];
const blockedRe = new RegExp(`\\b(${BLOCKED_WORDS.join('|')})\\w*`, 'gi');

/** Normalise and clean an (untrusted) message. Returns null if nothing is left. */
export function sanitizeMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let s = raw
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, ' ') // control & invisible formatting chars
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;
  if (s.length > CHAT.maxLength) s = s.slice(0, CHAT.maxLength);
  s = s.replace(blockedRe, (m) => m[0] + '*'.repeat(m.length - 1));
  return s;
}

/** Spam throttling for OUR outgoing messages. */
export class ChatRateLimiter {
  private sent: number[] = [];
  private last = '';

  constructor(private now: () => number = () => Date.now()) {}

  check(text: string): { ok: true } | { ok: false; reason: string } {
    const t = this.now();
    this.sent = this.sent.filter((s) => t - s < CHAT.burstWindowMs);
    const lastSent = this.sent[this.sent.length - 1];
    if (lastSent !== undefined && t - lastSent < CHAT.minIntervalMs) return { ok: false, reason: 'Slow down a little 🙂' };
    if (this.sent.length >= CHAT.burstMax) return { ok: false, reason: 'Too many messages — wait a few seconds.' };
    if (text.toLowerCase() === this.last.toLowerCase() && lastSent !== undefined && t - lastSent < 5000) {
      return { ok: false, reason: 'You just said that!' };
    }
    return { ok: true };
  }

  record(text: string) {
    this.sent.push(this.now());
    this.last = text;
  }
}

/** Receiver-side flood guard: max N messages per player per window. */
export class IncomingFloodGuard {
  private log = new Map<string, number[]>();
  constructor(private max = 8, private windowMs = 10000, private now: () => number = () => Date.now()) {}

  allow(id: string): boolean {
    const t = this.now();
    const arr = (this.log.get(id) ?? []).filter((s) => t - s < this.windowMs);
    if (arr.length >= this.max) {
      this.log.set(id, arr);
      return false;
    }
    arr.push(t);
    this.log.set(id, arr);
    return true;
  }
}
