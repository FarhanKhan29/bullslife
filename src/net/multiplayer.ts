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
import type { ItemId, MapId } from '../game/maps/types';
import { isMapId } from '../game/maps/registry';
import { ITEM_IDS } from '../game/items';
import type { Pose } from '../game/Avatar';
import { IncomingFloodGuard, sanitizeMessage } from '../social/chatSafety';
import { createChatIdentity, directChatKey, isChatKey, openChat, openFriendsChat, parseChatEnvelope, sealChat } from '../social/privateChat';
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
  pose: Pose;
  item: ItemId | null;
}

/** Shared one-off effects other players should see (basketball shot, piano…). */
export const FX_KINDS = ['hoop', 'kick', 'piano', 'drums', 'shake', 'pingpong'] as const;
export type FxKind = (typeof FX_KINDS)[number];
const POSES: Pose[] = ['stand', 'sit', 'lie'];

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  t: number;
  self: boolean;
}

const FACINGS: Facing[] = ['front', 'back', 'side'];

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
    isMapId(p.map);
  if (!ok) return null;
  const pose = typeof p.p === 'number' && p.p >= 0 && p.p <= 2 ? Math.floor(p.p) : 0;
  const it = typeof p.it === 'number' && p.it >= 0 && p.it < ITEM_IDS.length ? Math.floor(p.it) : -1;
  return { id: p.id as string, seq: p.seq as number, x: p.x as number, y: p.y as number, f: p.f as Facing, fl: !!p.fl, m: !!p.m, map: p.map as MapId, p: pose, it };
}

export function parseMeta(raw: unknown): PlayerMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !/^[a-z0-9]{6,40}$/.test(r.id)) return null;
  return {
    id: r.id,
    look: sanitizeAppearance(r.look),
    chatKey: isChatKey(r.chatKey) ? r.chatKey : undefined,
    map: isMapId(r.map) ? r.map : 'campus',
    plate: r.plate === 'A' || r.plate === 'B' ? r.plate : null,
    joinedAt: typeof r.joinedAt === 'number' ? r.joinedAt : 0,
  };
}

type Events = {
  players: (list: RemotePlayer[]) => void;
  chat: (msg: ChatMessage) => void;
  privateChat: (peerId: string | null, msg: ChatMessage) => void;
  emote: (id: string, emote: number) => void;
  status: (s: NetStatus) => void;
  coop: (until: number) => void;
  fx: (id: string, kind: FxKind, ok: boolean, x: number, y: number) => void;
  board: (map: MapId, board: string, text: string) => void;
  joined: (name: string) => void;
  left: (name: string) => void;
};

export class Multiplayer extends Emitter<Events> {
  readonly players = new Map<string, RemotePlayer>();
  status: NetStatus = 'offline';
  room = '';
  private transport: Transport | null = null;
  private meta: PlayerMeta;
  private connection = 0;
  private cleanup = Promise.resolve();
  private identity = createChatIdentity().catch(() => null);
  private chatRoom = '';
  private friendsKey: CryptoKey | null = null;
  private seq = 0;
  private seenChat = new Set<string>();
  private flood = new IncomingFloodGuard();
  private pruneTimer: number | null = null;
  private lastMove: MovePacket | null = null;
  private lastHelloReply = 0;
  coopUntil = 0;
  /** Whiteboard texts by `map|board`. */
  readonly boards = new Map<string, string>();

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

  async connect(room: string, friendsInvite: string | null = null) {
    const connection = ++this.connection;
    const stop = this.stopTransport();
    this.status = 'connecting';
    this.emit('status', this.status);
    this.room = room;
    this.players.clear();
    this.seenChat.clear();
    this.boards.clear();
    this.coopUntil = 0;
    this.emit('players', []);
    try {
      await stop;
      const identity = await this.identity;
      const group = friendsInvite ? await openFriendsChat(friendsInvite) : null;
      if (connection !== this.connection) return;
      if (group && !identity) throw new Error('Encrypted chat is unavailable');
      if (identity) this.meta = { ...this.meta, id: identity.id, chatKey: identity.chatKey };
      this.chatRoom = group?.room ?? 'north-v2:' + room;
      this.friendsKey = group?.key ?? null;
      const t: Transport = ONLINE_ENABLED ? new SupabaseTransport() : new LocalTransport();
      this.transport = t;
      t.onStatus = (status) => {
        if (connection !== this.connection) return;
        this.status = status;
        this.emit('status', status);
        if (status === 'online') {
          t.send('hello', { id: this.meta.id });
          if (this.lastMove) t.send('move', { ...this.lastMove, id: this.meta.id, seq: ++this.seq });
        }
      };
      t.onPresence = (metas) => {
        if (connection === this.connection) this.handlePresence(metas);
      };
      t.onEvent = (ev, payload) => {
        if (connection === this.connection) this.handleEvent(ev, payload);
      };
      const tMeta = this.meta;
      await t.connect(this.chatRoom, tMeta);
      if (connection !== this.connection) {
        await t.disconnect();
        return;
      }
      if (this.meta !== tMeta) t.updateMeta(this.meta);
      this.pruneTimer = window.setInterval(() => this.prune(), 2000);
    } catch (err) {
      if (connection !== this.connection) return;
      console.error('[net] connect failed', err);
      this.status = 'error';
      this.emit('status', this.status);
    }
  }

  async disconnect() {
    const connection = ++this.connection;
    await this.stopTransport();
    if (connection === this.connection) {
      this.status = 'offline';
      this.emit('status', this.status);
    }
  }

  private async stopTransport() {
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    this.pruneTimer = null;
    const t = this.transport;
    this.transport = null;
    this.friendsKey = null;
    if (t) this.cleanup = this.cleanup.catch(() => {}).then(() => t.disconnect());
    await this.cleanup;
  }

  updateMeta(patch: Partial<PlayerMeta>) {
    const next = { ...this.meta, ...patch };
    if (JSON.stringify(next) === JSON.stringify(this.meta)) return;
    this.meta = next;
    this.transport?.updateMeta(next);
  }

  sendMove(x: number, y: number, f: Facing, fl: boolean, m: boolean, map: MapId, pose: Pose = 'stand', item: ItemId | null = null) {
    const pkt: MovePacket = { id: this.meta.id, seq: ++this.seq, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, f, fl, m, map, p: POSES.indexOf(pose), it: item ? ITEM_IDS.indexOf(item) : -1 };
    this.lastMove = pkt;
    this.transport?.send('move', pkt as unknown as Record<string, unknown>);
  }

  sendChat(text: string): ChatMessage | null {
    if (this.status !== 'online' || !this.transport || this.friendsKey) return null;
    const msg = { id: this.meta.id, mid: randomId(10), text, t: Date.now() };
    this.rememberChat(msg.mid);
    this.transport.send('chat', msg);
    return { id: msg.id, name: this.meta.look.name, text, t: msg.t, self: true };
  }

  canMessage(peerId: string) {
    const peer = this.players.get(peerId);
    return !!(this.meta.chatKey && peer?.inPresence && peer.meta?.chatKey);
  }

  async sendPrivateChat(text: string, peerId: string | null): Promise<ChatMessage | null> {
    const t = this.transport;
    const room = this.chatRoom;
    if (!t || this.status !== 'online') return null;
    const address = { id: this.meta.id, to: peerId ?? '', mid: randomId(10) };
    try {
      const key = peerId ? await this.peerKey(peerId, room) : this.friendsKey;
      if (!key) return null;
      const packet = await sealChat(key, room, address, text);
      if (this.transport !== t || this.status !== 'online' || (peerId && !this.canMessage(peerId))) return null;
      t.send('sealed-chat', { ...packet });
      return { id: address.id, name: this.meta.look.name, text, t: Date.now(), self: true };
    } catch {
      return null;
    }
  }

  private async peerKey(id: string, room: string) {
    const peer = this.players.get(id);
    const identity = await this.identity;
    if (!identity || !peer?.inPresence || !peer.meta?.chatKey) return null;
    return directChatKey(identity.privateKey, id, peer.meta.chatKey, room);
  }

  private async receivePrivateChat(payload: Record<string, unknown>) {
    const packet = parseChatEnvelope(payload);
    if (!packet || packet.id === this.meta.id || (packet.to && packet.to !== this.meta.id)) return;
    const peer = this.players.get(packet.id);
    if (!peer?.inPresence || !peer.meta?.chatKey) return;
    const seenKey = 'sealed:' + packet.id + ':' + packet.mid;
    if (this.seenChat.has(seenKey)) return;
    const connection = this.connection;
    const room = this.chatRoom;
    try {
      const key = packet.to ? await this.peerKey(packet.id, room) : this.friendsKey;
      if (!key) return;
      const text = sanitizeMessage(await openChat(key, room, packet));
      if (connection !== this.connection || !text || this.seenChat.has(seenKey)) return;
      this.rememberChat(seenKey);
      if (!this.flood.allow('sealed:' + packet.id)) return;
      this.emit('privateChat', packet.to ? packet.id : null, {
        id: packet.id, name: peer.meta.look.name, text, t: Date.now(), self: false,
      });
    } catch {
      // A forged, corrupted or misaddressed message cannot be decrypted.
    }
  }

  private rememberChat(id: string) {
    this.seenChat.add(id);
    if (this.seenChat.size > 500) this.seenChat = new Set([...this.seenChat].slice(-250));
  }

  sendEmote(e: number) {
    this.transport?.send('emote', { id: this.meta.id, e });
  }

  sendFx(kind: FxKind, ok: boolean, x: number, y: number) {
    this.transport?.send('fx', { id: this.meta.id, k: FX_KINDS.indexOf(kind), ok, x, y });
  }

  setBoard(map: MapId, board: string, text: string) {
    this.boards.set(map + '|' + board, text);
    this.transport?.send('board', { id: this.meta.id, map, b: board, text });
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
          pose: 'stand',
          item: null,
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
        p = { id: m.id, meta: null, inPresence: false, x: m.x, y: m.y, facing: m.f, flip: m.fl, moving: m.m, map: m.map, hasPosition: true, lastSeq: m.seq, lastHeard: now, pose: POSES[m.p ?? 0], item: m.it !== undefined && m.it >= 0 ? ITEM_IDS[m.it] : null };
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
      p.pose = POSES[m.p ?? 0];
      p.item = m.it !== undefined && m.it >= 0 ? ITEM_IDS[m.it] : null;
      p.hasPosition = true;
      p.lastHeard = now;
    } else if (ev === 'sealed-chat') {
      void this.receivePrivateChat(payload);
    } else if (ev === 'chat' && !this.friendsKey) {
      const id = payload.id;
      const mid = payload.mid;
      if (typeof id !== 'string' || typeof mid !== 'string' || mid.length > 20 || id === this.meta.id) return;
      if (this.seenChat.has(mid)) return;
      this.rememberChat(mid);
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
        let n = 0;
        for (const [key, text] of this.boards) {
          if (n++ > 12) break;
          const [map, b] = key.split('|');
          this.transport?.send('board', { id: this.meta.id, map, b, text });
        }
      }
    } else if (ev === 'fx') {
      const id = payload.id;
      const k = payload.k;
      const x = payload.x;
      const y = payload.y;
      if (typeof id !== 'string' || !this.players.get(id)?.meta || typeof k !== 'number' || !FX_KINDS[k] || typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 500 || Math.abs(y) > 500) return;
      if (!this.flood.allow('fx:' + id)) return;
      this.emit('fx', id, FX_KINDS[k], !!payload.ok, x, y);
    } else if (ev === 'board') {
      const id = payload.id;
      const b = payload.b;
      if (typeof id !== 'string' || typeof b !== 'string' || !/^[a-z0-9-]{1,24}$/.test(b) || !isMapId(payload.map)) return;
      if (!this.flood.allow('board:' + id)) return;
      const text = sanitizeMessage(payload.text) ?? '';
      const key = payload.map + '|' + b;
      if (this.boards.get(key) === text) return;
      this.boards.set(key, text);
      this.emit('board', payload.map as MapId, b, text);
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
