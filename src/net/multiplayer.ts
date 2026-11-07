/**
 * Multiplayer room manager: turns raw transport messages into game state.
 *  - validates every incoming packet (never trust the network)
 *  - drops duplicate / out-of-order movement (sequence numbers)
 *  - de-duplicates chat by message id
 *  - removes players who leave Presence, and prunes stale ghosts
 */
import { sanitizeAppearance } from '../character/appearance';
import type { Facing } from '../character/avatarRenderer';
import { NET, ONLINE_ENABLED } from '../core/config';
import { Emitter } from '../core/emitter';
import { randomId } from '../core/storage';
import type { MapId } from '../game/maps/types';
import { IncomingFloodGuard, sanitizeMessage } from '../social/chatSafety';
import { LocalTransport } from './localTransport';
import { SupabaseTransport } from './supabaseTransport';
import type { MovePacket, NetStatus, PlayerMeta, Transport } from './types';

export interface RemotePlayer {
  id: string;
  meta: PlayerMeta | null; // null until Presence tells us who they are
  inPresence: boolean;
  x: number;
  y: number;
  facing: Facing;
  flip: boolean;
  moving: boolean;
  map: MapId;
  hasPosition: boolean;
  lastSeq: number;
  lastHeard: number;
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  t: number;
  self: boolean;
}

const FACINGS: Facing[] = ['front', 'back', 'side'];
const MAPS: MapId[] = ['campus', 'union'];

/** Validate a movement packet. Exported for tests. */
export function parseMove(p: Record<string, unknown>): MovePacket | null {
  const ok =
    typeof p.id === 'string' &&
    p.id.length <= 40 &&
    typeof p.seq === 'number' &&
    Number.isFinite(p.seq) &&
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    Math.abs(p.x) < 500 &&
    Math.abs(p.y) < 500 &&
    FACINGS.includes(p.f as Facing) &&
    MAPS.includes(p.map as MapId);
  if (!ok) return null;
  return { id: p.id as string, seq: p.seq as number, x: p.x as number, y: p.y as number, f: p.f as Facing, fl: !!p.fl, m: !!p.m, map: p.map as MapId };
}

export function parseMeta(raw: unknown): PlayerMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !/^[a-z0-9]{6,40}$/.test(r.id)) return null;
  return {
    id: r.id,
    look: sanitizeAppearance(r.look),
    map: MAPS.includes(r.map as MapId) ? (r.map as MapId) : 'campus',
    plate: r.plate === 'A' || r.plate === 'B' ? r.plate : null,
    joinedAt: typeof r.joinedAt === 'number' ? r.joinedAt : 0,
  };
}

type Events = {
  players: (list: RemotePlayer[]) => void;
  chat: (msg: ChatMessage) => void;
  emote: (id: string, emote: number) => void;
  status: (s: NetStatus) => void;
  coop: (until: number) => void;
  joined: (name: string) => void;
  left: (name: string) => void;
};

export class Multiplayer extends Emitter<Events> {
  readonly players = new Map<string, RemotePlayer>();
  status: NetStatus = 'offline';
  room = '';
  private transport: Transport | null = null;
  private meta: PlayerMeta;
  private seq = 0;
  private seenChat = new Set<string>();
  private flood = new IncomingFloodGuard();
  private pruneTimer: number | null = null;
  private lastMove: MovePacket | null = null;
  private lastHelloReply = 0;
  coopUntil = 0;

  constructor(meta: PlayerMeta) {
    super();
    this.meta = meta;
  }

  get selfId() {
    return this.meta.id;
  }
  get selfMeta() {
    return this.meta;
  }
  get mode(): 'online' | 'local' {
    return this.transport?.kind === 'supabase' ? 'online' : 'local';
  }

  async connect(room: string) {
    await this.disconnect();
    this.room = room;
    this.players.clear();
    this.emit('players', []);
    const t: Transport = ONLINE_ENABLED ? new SupabaseTransport() : new LocalTransport();
    this.transport = t;
    t.onStatus = (s) => {
      this.status = s;
      this.emit('status', s);
      if (s === 'online') {
        // ask everyone to tell us where they are right now
        t.send('hello', { id: this.meta.id });
        if (this.lastMove) t.send('move', { ...this.lastMove, seq: ++this.seq });
      }
    };
    t.onPresence = (metas) => this.handlePresence(metas);
    t.onEvent = (ev, payload) => this.handleEvent(ev, payload);
    try {
      await t.connect(room, this.meta);
    } catch (err) {
      console.error('[net] connect failed', err);
      this.status = 'error';
      this.emit('status', 'error');
    }
    this.pruneTimer = window.setInterval(() => this.prune(), 2000);
  }

  async disconnect() {
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    this.pruneTimer = null;
    const t = this.transport;
    this.transport = null;
    if (t) await t.disconnect();
  }

  updateMeta(patch: Partial<PlayerMeta>) {
    const next = { ...this.meta, ...patch };
    if (JSON.stringify(next) === JSON.stringify(this.meta)) return;
    this.meta = next;
    this.transport?.updateMeta(next);
  }

  sendMove(x: number, y: number, f: Facing, fl: boolean, m: boolean, map: MapId) {
    const pkt: MovePacket = { id: this.meta.id, seq: ++this.seq, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, f, fl, m, map };
    this.lastMove = pkt;
    this.transport?.send('move', pkt as unknown as Record<string, unknown>);
  }

  sendChat(text: string): ChatMessage {
    const msg = { id: this.meta.id, mid: randomId(10), text, t: Date.now() };
    this.seenChat.add(msg.mid);
    this.transport?.send('chat', msg);
    return { id: msg.id, name: this.meta.look.name, text, t: msg.t, self: true };
  }

  sendEmote(e: number) {
    this.transport?.send('emote', { id: this.meta.id, e });
  }

  announceCoop(until: number) {
    this.coopUntil = Math.max(this.coopUntil, until);
    this.transport?.send('coop', { id: this.meta.id, until });
  }

  /** Every player we know, including ourselves, for presence-derived logic. */
  allMetas(): PlayerMeta[] {
    const list = [...this.players.values()].filter((p) => p.inPresence && p.meta).map((p) => p.meta!);
    list.push(this.meta);
    return list;
  }

  onlineCount(): number {
    return [...this.players.values()].filter((p) => p.inPresence).length + 1;
  }

  // ---------- incoming ----------
  private handlePresence(raw: PlayerMeta[]) {
    const now = Date.now();
    const present = new Set<string>();
    for (const r of raw) {
      const meta = parseMeta(r);
      if (!meta || meta.id === this.meta.id) continue;
      present.add(meta.id);
      const existing = this.players.get(meta.id);
      if (existing) {
        if (!existing.inPresence) this.emit('joined', meta.look.name);
        existing.meta = meta;
        existing.inPresence = true;
        existing.map = existing.hasPosition ? existing.map : meta.map;
        existing.lastHeard = now;
      } else {
        this.players.set(meta.id, {
          id: meta.id,
          meta,
          inPresence: true,
          x: 0,
          y: 0,
          facing: 'front',
          flip: false,
          moving: false,
          map: meta.map,
          hasPosition: false,
          lastSeq: -1,
          lastHeard: now,
        });
        this.emit('joined', meta.look.name);
      }
    }
    // anyone no longer in presence has left / disconnected → remove (no ghosts)
    for (const [id, p] of this.players) {
      if (!present.has(id) && p.inPresence) {
        this.players.delete(id);
        if (p.meta) this.emit('left', p.meta.look.name);
      }
    }
    this.emit('players', [...this.players.values()]);
  }

  private handleEvent(ev: string, payload: Record<string, unknown>) {
    const now = Date.now();
    if (ev === 'move') {
      const m = parseMove(payload);
      if (!m || m.id === this.meta.id) return;
      let p = this.players.get(m.id);
      if (!p) {
        // movement can arrive before presence; keep it hidden until we know who it is
        p = { id: m.id, meta: null, inPresence: false, x: m.x, y: m.y, facing: m.f, flip: m.fl, moving: m.m, map: m.map, hasPosition: true, lastSeq: m.seq, lastHeard: now };
        this.players.set(m.id, p);
        return;
      }
      // a reconnecting client restarts its counter at a small number
      const restarted = m.seq < 5 && p.lastSeq > 50;
      if (m.seq <= p.lastSeq && !restarted) return; // duplicate or out-of-order
      p.lastSeq = m.seq;
      p.x = m.x;
      p.y = m.y;
      p.facing = m.f;
      p.flip = m.fl;
      p.moving = m.m;
      p.map = m.map;
      p.hasPosition = true;
      p.lastHeard = now;
    } else if (ev === 'chat') {
      const id = payload.id;
      const mid = payload.mid;
      if (typeof id !== 'string' || typeof mid !== 'string' || mid.length > 20 || id === this.meta.id) return;
      if (this.seenChat.has(mid)) return;
      this.seenChat.add(mid);
      if (this.seenChat.size > 500) this.seenChat = new Set([...this.seenChat].slice(-250));
      if (!this.flood.allow(id)) return;
      const text = sanitizeMessage(payload.text);
      const p = this.players.get(id);
      if (!text || !p?.meta) return;
      this.emit('chat', { id, name: p.meta.look.name, text, t: now, self: false });
    } else if (ev === 'emote') {
      const id = payload.id;
      const e = payload.e;
      if (typeof id !== 'string' || typeof e !== 'number' || e < 0 || e > 4 || !this.players.get(id)?.meta) return;
      if (!this.flood.allow('emote:' + id)) return;
      this.emit('emote', id, Math.floor(e));
    } else if (ev === 'hello') {
      // a newcomer asks for positions; reply at most twice a second
      if (now - this.lastHelloReply > 500 && this.lastMove) {
        this.lastHelloReply = now;
        this.transport?.send('move', { ...this.lastMove, seq: ++this.seq });
        if (this.coopUntil > now) this.transport?.send('coop', { id: this.meta.id, until: this.coopUntil });
      }
    } else if (ev === 'coop') {
      const until = payload.until;
      // sanity: only accept a portal window that ends within ~70s and when we are not alone
      if (typeof until === 'number' && until > now && until - now < 70_000 && this.onlineCount() >= 2) {
        this.coopUntil = Math.max(this.coopUntil, until);
        this.emit('coop', this.coopUntil);
      }
    }
  }

  private prune() {
    const now = Date.now();
    let changed = false;
    for (const [id, p] of this.players) {
      if (!p.inPresence && now - p.lastHeard > NET.staleRemoveMs) {
        this.players.delete(id);
        changed = true;
      }
    }
    if (changed) this.emit('players', [...this.players.values()]);
  }
}
