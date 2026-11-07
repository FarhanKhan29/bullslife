/**
 * LOCAL MODE transport (used when Supabase is not configured).
 * Uses BroadcastChannel, so it connects browser TABS ON THE SAME DEVICE only.
 * Presence is emulated with heartbeats + timeouts.
 */
import type { NetStatus, PlayerMeta, Transport } from './types';

const HEARTBEAT_MS = 1500;
const TIMEOUT_MS = 5000;

export class LocalTransport implements Transport {
  readonly kind = 'local' as const;
  onPresence: (metas: PlayerMeta[]) => void = () => {};
  onEvent: (event: string, payload: Record<string, unknown>) => void = () => {};
  onStatus: (status: NetStatus) => void = () => {};

  private channel: BroadcastChannel | null = null;
  private meta: PlayerMeta | null = null;
  private peers = new Map<string, { meta: PlayerMeta; seen: number }>();
  private timer: number | null = null;
  private unload = () => this.post({ type: 'leave', id: this.meta?.id });

  async connect(room: string, meta: PlayerMeta): Promise<void> {
    this.meta = meta;
    this.onStatus('connecting');
    if (typeof BroadcastChannel === 'undefined') {
      this.onStatus('error');
      return;
    }
    this.channel = new BroadcastChannel('bullslife:' + room);
    this.channel.onmessage = (ev) => this.handle(ev.data);
    window.addEventListener('beforeunload', this.unload);
    window.addEventListener('pagehide', this.unload);
    this.timer = window.setInterval(() => this.tick(), HEARTBEAT_MS);
    this.post({ type: 'presence', meta });
    this.emitPresence();
    this.onStatus('online');
  }

  updateMeta(meta: PlayerMeta): void {
    this.meta = meta;
    this.post({ type: 'presence', meta });
    this.emitPresence();
  }

  send(event: string, payload: Record<string, unknown>): void {
    this.post({ type: 'bc', event, payload });
  }

  async disconnect(): Promise<void> {
    this.unload();
    window.removeEventListener('beforeunload', this.unload);
    window.removeEventListener('pagehide', this.unload);
    if (this.timer) clearInterval(this.timer);
    this.channel?.close();
    this.channel = null;
    this.peers.clear();
    this.onStatus('offline');
  }

  private post(msg: unknown) {
    try {
      this.channel?.postMessage(msg);
    } catch {
      /* channel closed */
    }
  }

  private tick() {
    if (this.meta) this.post({ type: 'presence', meta: this.meta });
    const now = Date.now();
    let changed = false;
    for (const [id, p] of this.peers) {
      if (now - p.seen > TIMEOUT_MS) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) this.emitPresence();
  }

  private handle(msg: any) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'presence' && msg.meta?.id && msg.meta.id !== this.meta?.id) {
      const isNew = !this.peers.has(msg.meta.id);
      this.peers.set(msg.meta.id, { meta: msg.meta, seen: Date.now() });
      // reply so the newcomer learns about us right away
      if (isNew && this.meta) this.post({ type: 'presence', meta: this.meta });
      this.emitPresence();
    } else if (msg.type === 'leave' && msg.id) {
      if (this.peers.delete(msg.id)) this.emitPresence();
    } else if (msg.type === 'bc' && typeof msg.event === 'string') {
      this.onEvent(msg.event, msg.payload ?? {});
    }
  }

  private emitPresence() {
    const metas = [...this.peers.values()].map((p) => p.meta);
    if (this.meta) metas.push(this.meta);
    this.onPresence(metas);
  }
}
