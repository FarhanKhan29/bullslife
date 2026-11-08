/**
 * ONLINE transport using Supabase Realtime.
 *   - Presence  → who is in the room (+ their outfit, map, co-op plate)
 *   - Broadcast → movement, chat, emotes (ephemeral, nothing is stored)
 * Only the public anon/publishable key is used. Never ship a service_role key.
 */
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_PRIVATE_CHANNELS, SUPABASE_URL } from '../core/config';
import type { NetStatus, PlayerMeta, Transport } from './types';

export const NET_EVENTS = ['move', 'chat', 'sealed-chat', 'emote', 'hello', 'coop', 'fx', 'board'] as const;

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 30 } },
  });
  return client;
}

export class SupabaseTransport implements Transport {
  readonly kind = 'supabase' as const;
  onPresence: (metas: PlayerMeta[]) => void = () => {};
  onEvent: (event: string, payload: Record<string, unknown>) => void = () => {};
  onStatus: (status: NetStatus) => void = () => {};

  private closed = false;
  private channel: RealtimeChannel | null = null;
  private meta: PlayerMeta | null = null;

  async connect(room: string, meta: PlayerMeta): Promise<void> {
    this.meta = meta;
    this.onStatus('connecting');
    const sb = getClient();

    if (SUPABASE_PRIVATE_CHANNELS) {
      // Anonymous auth gives each guest a JWT so Realtime RLS policies can apply.
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        const { error } = await sb.auth.signInAnonymously();
        if (error) console.warn('[net] anonymous sign-in failed — enable it in Supabase Auth settings', error.message);
      }
      const session = (await sb.auth.getSession()).data.session;
      if (session) await sb.realtime.setAuth(session.access_token);
    }

    if (this.closed) return;
    const channel = sb.channel(`room:${room}`, {
      config: {
        presence: { key: meta.id },
        broadcast: { self: false, ack: false },
        private: SUPABASE_PRIVATE_CHANNELS,
      },
    });
    this.channel = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PlayerMeta>();
      const metas: PlayerMeta[] = [];
      for (const key of Object.keys(state)) {
        const entries = state[key];
        // a reconnecting client can briefly appear twice; keep the newest entry
        const latest = entries[entries.length - 1];
        if (latest) metas.push(latest as unknown as PlayerMeta);
      }
      this.onPresence(metas);
    });

    for (const ev of NET_EVENTS) {
      channel.on('broadcast', { event: ev }, (msg) => this.onEvent(ev, (msg.payload ?? {}) as Record<string, unknown>));
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.onStatus('online');
        // (re)track on every successful (re)subscribe so reconnects restore presence
        if (this.meta) await channel.track(this.meta as unknown as Record<string, unknown>);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.onStatus('error');
      } else if (status === 'CLOSED') {
        this.onStatus('offline');
      }
    });
  }

  updateMeta(meta: PlayerMeta): void {
    this.meta = meta;
    if (this.channel?.state === 'joined') void this.channel.track(meta as unknown as Record<string, unknown>);
  }

  send(event: string, payload: Record<string, unknown>): void {
    void this.channel?.send({ type: 'broadcast', event, payload });
  }

  async disconnect(): Promise<void> {
    this.closed = true;
    if (!this.channel) return;
    const ch = this.channel;
    this.channel = null;
    try {
      await ch.untrack();
    } catch {
      /* ignore */
    }
    await getClient().removeChannel(ch);
    this.onStatus('offline');
  }
}
