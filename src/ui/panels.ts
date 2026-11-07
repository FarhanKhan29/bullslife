/** Friends, Settings, Passport, Report and Info panels. */
import { getStamps, stampCount, STAMPS } from '../activities/passport';
import { drawPreview } from '../character/avatarRenderer';
import { play } from '../core/audio';
import { DEFAULT_ROOM, ONLINE_ENABLED } from '../core/config';
import { getNet, inviteLink, sanitizeRoom, session, switchRoom } from '../core/session';
import { getSettings, updateSettings } from '../core/settings';
import { randomId } from '../core/storage';
import { isBlocked, isFavorite, isMuted, listFavorites, moderationEvents, saveReport, toggleBlock, toggleFavorite, toggleMute } from '../social/moderation';
import { closeModal, copyText, h, openModal, toast } from './dom';

// ---------------------------------------------------------------- Friends
export function openFriends() {
  const body = h('div');
  const render = () => {
    const net = session.net;
    const players = net ? [...net.players.values()].filter((p) => p.inPresence && p.meta) : [];
    const link = inviteLink();
    const joinInput = h('input', { class: 'field', placeholder: 'Room code or invite link', 'aria-label': 'Room code', style: 'flex:1;min-width:160px' }) as HTMLInputElement;
    const join = async () => {
      let v = joinInput.value.trim();
      try {
        if (v.includes('://')) v = new URL(v).searchParams.get('room') ?? '';
      } catch {
        /* not a URL */
      }
      const room = sanitizeRoom(v);
      if (!room) return toast('Room codes are 3–24 letters, numbers or dashes.', 'warn');
      await switchRoom(room);
      play('join');
      toast(`Joined room “${room}”`, 'success');
      render();
    };
    joinInput.addEventListener('keydown', (e) => e.key === 'Enter' && join());

    const rows = players.length
      ? players.map((p) => {
          const c = h('canvas', { width: 68, height: 102 });
          drawPreview(c, p.meta!.look, 'front', 0);
          const name = p.meta!.look.name;
          const btn = (icon: string, title: string, on: boolean, fn: () => void) => h('button', { class: 'icon-btn' + (on ? ' on' : ''), title, 'aria-label': title, onclick: fn, text: icon });
          return h(
            'div',
            { class: 'player-row' },
            c,
            h('div', { class: 'pname' }, name, h('small', { text: p.map === 'union' ? 'In the Student Union' : 'On campus' })),
            btn('⭐', isFavorite(p.id) ? 'Remove favorite' : 'Add to favorites (this session)', isFavorite(p.id), () => toggleFavorite(p.id, name)),
            btn(isMuted(p.id) ? '🔇' : '🔈', isMuted(p.id) ? 'Unmute' : 'Mute chat', isMuted(p.id), () => toggleMute(p.id)),
            btn('🚫', isBlocked(p.id) ? 'Unblock' : 'Block (hide player & chat for you)', isBlocked(p.id), () => toggleBlock(p.id)),
            btn('⚑', 'Report', false, () => openReport(p.id, name)),
          );
        })
      : [h('div', { class: 'note', text: session.playing ? 'No one else is here yet. Share your invite link so a friend can join you!' : 'Press PLAY to see who is online in this room.' })];

    const favs = listFavorites();
    body.replaceChildren(
      h('div', { class: 'section-title', text: '🔗 Invite a friend' }),
      h('div', { class: 'row' }, h('span', { class: 'muted', text: 'Room' }), h('span', { class: 'room-code', text: session.room })),
      h(
        'div',
        { class: 'row', style: 'margin-top:10px' },
        h(
          'button',
          {
            class: 'btn',
            onclick: async () => {
              const ok = await copyText(link);
              toast(ok ? 'Invite link copied! Send it to a friend.' : link, ok ? 'success' : 'info', 5000);
            },
            text: '📋 Copy invite link',
          },
        ),
        navigator.share
          ? h('button', { class: 'btn light', onclick: () => navigator.share({ title: 'Join me on BULLSLIFE', url: link }).catch(() => {}), text: '📤 Share' })
          : null,
        h(
          'button',
          {
            class: 'btn light',
            onclick: async () => {
              const room = 'ub-' + randomId(5);
              await switchRoom(room);
              play('join');
              toast(`New room “${room}” created — copy the link to invite friends.`, 'success', 4500);
              render();
            },
            text: '✨ New private room',
          },
        ),
      ),
      h('div', { class: 'section-title', text: '🚪 Join a friend’s room' }),
      h('div', { class: 'row' }, joinInput, h('button', { class: 'btn gold', onclick: join, text: 'Join' }), session.room !== DEFAULT_ROOM ? h('button', { class: 'btn ghost', onclick: async () => { await switchRoom(DEFAULT_ROOM); render(); }, text: 'Back to public campus' }) : null),
      h('div', { class: 'section-title', text: `🟢 Online in this room (${players.length + (session.playing ? 1 : 0)})` }),
      ...rows,
      favs.length ? h('div', { class: 'section-title', text: '⭐ Favorites (this session only)' }) : '',
      favs.length ? h('div', { class: 'muted', text: favs.map((f) => f.name).join(', ') }) : '',
      h(
        'div',
        { class: 'note', style: 'margin-top:14px' },
        'Favorites, mute and block are saved only in this browser tab. Guest identities are temporary — there are no permanent accounts or friend lists yet.',
      ),
      !ONLINE_ENABLED ? h('div', { class: 'note warn', style: 'margin-top:8px', text: 'Local mode: Supabase is not configured, so rooms only connect browser tabs on this device.' }) : '',
    );
  };
  render();
  // re-render on changes, but never while the user is typing a room code
  const safeRender = () => {
    if (!body.contains(document.activeElement) || document.activeElement?.tagName !== 'INPUT') render();
  };
  const offs = [moderationEvents.on('change', safeRender), session.net ? session.net.on('players', safeRender) : () => {}];
  openModal({ title: 'Friends', icon: '👥', body, onClose: () => offs.forEach((o) => o()) });
}

// ---------------------------------------------------------------- Report
export function openReport(playerId: string, playerName: string) {
  const reason = h(
    'select',
    { class: 'field', 'aria-label': 'Reason' },
    ...['Harassment or bullying', 'Spam', 'Inappropriate name or outfit', 'Hate speech', 'Sharing personal info', 'Other'].map((r) => h('option', { text: r })),
  ) as HTMLSelectElement;
  const details = h('textarea', { class: 'field', rows: 3, maxlength: 300, placeholder: 'What happened? (optional)' }) as HTMLTextAreaElement;
  const alsoBlock = h('input', { type: 'checkbox', checked: true, id: 'rb' }) as HTMLInputElement;
  openModal({
    title: `Report ${playerName}`,
    icon: '⚑',
    body: h(
      'div',
      {},
      h('div', { class: 'opt-label', text: 'Reason' }),
      reason,
      h('div', { class: 'opt-label', style: 'margin-top:10px', text: 'Details' }),
      details,
      h('label', { class: 'row', style: 'margin-top:10px;font-weight:800', for: 'rb' }, alsoBlock, 'Also block this player for me'),
      h(
        'div',
        { class: 'note warn', style: 'margin-top:12px' },
        'Hackathon build: there is no moderation server yet, so this report is saved on this device only and is not sent to anyone. Blocking takes effect immediately for you.',
      ),
    ),
    foot: h(
      'button',
      {
        class: 'btn danger',
        onclick: () => {
          saveReport({ playerId, playerName, reason: reason.value, details: details.value.slice(0, 300), room: session.room, at: new Date().toISOString(), recentMessages: [] });
          if (alsoBlock.checked && !isBlocked(playerId)) toggleBlock(playerId);
          closeModal();
          toast('Report saved locally. Thanks for keeping campus friendly.', 'success');
        },
        text: 'Save report',
      },
    ),
  });
}

// ---------------------------------------------------------------- Settings
export function openSettings() {
  const body = h('div');
  const render = () => {
    const s = getSettings();
    const toggle = (on: boolean, fn: () => void, lbl: string) => h('button', { class: 'toggle' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(on), 'aria-label': lbl, onclick: () => { fn(); render(); } });
    const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.sfxVolume, 'aria-label': 'Sound volume' }) as HTMLInputElement;
    vol.addEventListener('change', () => {
      updateSettings({ sfxVolume: +vol.value });
      play('click');
    });
    const seg = <T extends string | number>(opts: [T, string][], cur: T, fn: (v: T) => void) =>
      h('div', { class: 'seg' }, ...opts.map(([v, l]) => h('button', { class: v === cur ? 'on' : '', onclick: () => { fn(v); render(); }, text: l })));
    body.replaceChildren(
      h('div', { class: 'section-title', text: '🔊 Sound' }),
      h('div', { class: 'setting' }, 'Sound effects volume', vol),
      h('div', { class: 'setting' }, 'Cozy background music', toggle(s.music, () => updateSettings({ music: !s.music }), 'Music')),
      h('div', { class: 'section-title', text: '🎨 Graphics' }),
      h('div', { class: 'setting' }, 'Effects quality', seg<'high' | 'low'>([['high', 'High'], ['low', 'Low']], s.quality, (v) => { updateSettings({ quality: v }); toast('Applies when you change location or reload.', 'info'); })),
      h('div', { class: 'setting' }, 'Camera zoom', seg<number>([[0.8, 'Far'], [1, 'Normal'], [1.3, 'Close']], s.zoom, (v) => updateSettings({ zoom: v }))),
      h('div', { class: 'setting' }, 'Show controls hint', toggle(s.showHints, () => updateSettings({ showHints: !s.showHints }), 'Hints')),
      h('div', { class: 'section-title', text: '🎮 Controls' }),
      h(
        'div',
        { class: 'keys' },
        h('span', {}, h('kbd', { text: 'W' }), ' ', h('kbd', { text: 'A' }), ' ', h('kbd', { text: 'S' }), ' ', h('kbd', { text: 'D' })), 'Walk (or arrow keys / drag on touch screens)',
        h('span', {}, h('kbd', { text: 'E' })), 'Interact, enter, collect stamps',
        h('span', {}, h('kbd', { text: 'Enter' })), 'Open chat / send message',
        h('span', {}, h('kbd', { text: '1' }), '–', h('kbd', { text: '5' })), 'Emotes: 👋 🎉 ❤️ ❓ ⭐',
        h('span', {}, h('kbd', { text: 'Esc' })), 'Close windows / leave chat',
      ),
    );
  };
  render();
  openModal({ title: 'Settings', icon: '⚙️', body });
}

// ---------------------------------------------------------------- Passport
export function openPassport() {
  const s = getStamps();
  const n = stampCount();
  openModal({
    title: 'Campus Passport',
    icon: '🛂',
    body: h(
      'div',
      { class: 'passport' },
      h('h3', { text: 'UB North Campus Passport' }),
      h('div', { style: 'font-weight:800;opacity:.85', text: `${session.appearance.name} · ${n}/3 stamps` }),
      h('div', { class: 'progress' }, h('i', { style: `width:${(n / 3) * 100}%` })),
      h(
        'div',
        { class: 'stamps' },
        ...STAMPS.map((st) =>
          h(
            'div',
            { class: 'stamp' + (s[st.id] ? ' got' : ''), style: `--c:${st.color}` },
            h('div', { class: 'seal', text: st.emoji }),
            h('div', {}, h('b', { text: st.name }), h('small', { text: s[st.id] ? `Stamped ${new Date(s[st.id]!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : st.hint })),
          ),
        ),
      ),
      n === 3 ? h('div', { style: 'margin-top:14px;font-weight:800;text-align:center', text: '🏆 Campus Explorer! You visited every landmark.' }) : null,
    ),
  });
}

export function openInfo(text: string) {
  openModal({ title: 'Campus', icon: '💬', body: h('div', { style: 'font-size:16px;font-weight:700;line-height:1.45', text }), foot: h('button', { class: 'btn', onclick: () => closeModal(), text: 'OK' }) });
}

export function onlineSummary(): string {
  const net = getNet();
  return `${net.onlineCount()}`;
}
