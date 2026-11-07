/** In-game HUD: location, online counter, panel buttons, prompts, emotes, hints. */
import { stampCount, STAMP_TOTAL } from '../activities/passport';
import { ONLINE_ENABLED } from '../core/config';
import { bus, getNet, session } from '../core/session';
import { getSettings, settingsEvents, updateSettings } from '../core/settings';
import { EMOTES } from '../game/Avatar';
import type { NetStatus } from '../net/types';
import { createChat } from './chat';
import { h, toast, uiRoot } from './dom';
import { askText, openInfo, openPassport } from './panels';
import { createMinimap } from './minimap';

export function createHud(actions: { friends: () => void; character: () => void; settings: () => void; leave: () => void }) {
  const net = getNet();
  const locName = h('div', { class: 'loc-name', text: 'UB North Campus' });
  const statusPill = h('span', { class: 'pill' });
  const roomLabel = h('span', { text: '' });
  const loc = h('div', { class: 'hud-card' }, locName, h('div', { class: 'loc-sub' }, statusPill, roomLabel));

  const count = h('span', { class: 'count', text: '1' });
  const stampBadge = h('span', { class: 'badge', text: `${stampCount()}/${STAMP_TOTAL}` });
  const btn = (emoji: string, label: string, onclick: () => void, extra?: Node, cls = '') =>
    h('button', { class: 'hud-btn ' + cls, onclick, title: label, 'aria-label': label }, h('span', { class: 'emoji', text: emoji }), h('span', { class: 'label', text: label }), extra ?? null);

  const right = h(
    'div',
    { class: 'hud-right' },
    btn('🟢', 'Online', actions.friends, h('span', {}, ' ', count), 'online'),
    btn('🛂', 'Passport', openPassport, stampBadge),
    btn('👥', 'Friends', actions.friends),
    btn('🎨', 'Character', actions.character),
    btn('⚙️', 'Settings', actions.settings),
    btn('🏠', 'Menu', actions.leave),
  );
  const top = h('div', { class: 'hud-top' }, loc, right);

  const prompt = h('button', { class: 'prompt', style: 'display:none', onclick: () => bus.emit('interact') });
  const emotes = h(
    'div',
    { class: 'emote-bar', role: 'toolbar', 'aria-label': 'Emotes' },
    ...EMOTES.map((e, i) =>
      h('button', { class: 'emote', 'aria-label': e.label, onclick: () => bus.emit('localEmote', i) }, h('small', { text: String(i + 1) }), e.emoji, h('span', { class: 'tip', text: e.label })),
    ),
  );

  const guide = h(
    'div',
    { class: 'hud-card controls-guide' },
    h('h4', {}, 'How to play', h('button', { 'aria-label': 'Hide hints', onclick: () => updateSettings({ showHints: false }), text: '×' })),
    h('div', {}, h('span', { class: 'k', text: 'WASD' }), ' walk  ', h('span', { class: 'k', text: 'Shift' }), ' run'),
    h('div', {}, h('span', { class: 'k', text: 'E' }), ' sit, eat, use things, enter'),
    h('div', {}, h('span', { class: 'k', text: 'Enter' }), ' chat  ', h('span', { class: 'k', text: '1-5' }), ' emotes  ', h('span', { class: 'k', text: 'M' }), ' map'),
    h('div', { style: 'opacity:.8' }, `🎯 Every building is open — collect all ${STAMP_TOTAL} passport stamps!`),
  );
  const syncGuide = () => (guide.style.display = getSettings().showHints ? '' : 'none');
  syncGuide();

  const chat = createChat();
  const minimap = createMinimap();
  const root = h('div', { class: 'hud' }, top, minimap.el, guide, prompt, emotes, chat.el);
  uiRoot().append(root);

  const setStatus = (s: NetStatus) => {
    const local = !ONLINE_ENABLED;
    statusPill.className = 'pill ' + (s === 'online' ? 'ok' : s === 'error' ? 'warn' : '');
    statusPill.replaceChildren(h('span', { class: 'dot' }), local ? (s === 'online' ? 'Local mode' : s) : s === 'online' ? 'Online' : s === 'connecting' ? 'Connecting…' : s === 'error' ? 'Connection problem' : 'Offline');
    statusPill.title = local ? 'Supabase not configured — multiplayer works between tabs on this device only.' : '';
  };
  setStatus(net.status);
  roomLabel.textContent = `· room ${session.room}`;
  const updateCount = () => (count.textContent = String(net.onlineCount()));
  updateCount();

  let lastStatus = net.status;
  const offs = [
    net.on('status', (s) => {
      setStatus(s);
      if (s === 'error' && lastStatus !== 'error') toast('Connection problem — retrying automatically…', 'warn');
      if (s === 'online' && lastStatus === 'error') toast('Reconnected!', 'success');
      lastStatus = s;
    }),
    net.on('players', () => {
      updateCount();
      roomLabel.textContent = `· room ${session.room}`;
    }),
    bus.on('prompt', (text) => {
      if (!text) {
        prompt.style.display = 'none';
        return;
      }
      prompt.style.display = '';
      if (text.startsWith('E|')) prompt.replaceChildren(h('kbd', { text: 'E' }), text.slice(2));
      else prompt.replaceChildren(text);
    }),
    bus.on('location', (_m, name) => (locName.textContent = name)),
    bus.on('toast', (t, k) => toast(t, k)),
    bus.on('info', (t) => openInfo(t)),
    bus.on('askText', (title, initial, done) => askText(title, initial, done)),
    bus.on('openPanel', (p) => p === 'passport' && setTimeout(openPassport, 700)),
    settingsEvents.on('change', syncGuide),
  ];
  const refreshStamps = setInterval(() => (stampBadge.textContent = `${stampCount()}/${STAMP_TOTAL}`), 1000);

  return {
    destroy() {
      offs.forEach((o) => o());
      clearInterval(refreshStamps);
      chat.destroy();
      minimap.destroy();
      root.remove();
    },
  };
}
