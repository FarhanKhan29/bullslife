/** Animated main menu shown over the live, drifting campus. */
import { drawPreview } from '../character/avatarRenderer';
import { play } from '../core/audio';
import { DEFAULT_ROOM, ONLINE_ENABLED } from '../core/config';
import { bus, session } from '../core/session';
import { h, uiRoot } from './dom';

export function createMenu(actions: { play: () => void; character: () => void; friends: () => void; settings: () => void }) {
  const title = h('h1', { class: 'menu-title', 'aria-label': 'BULLSLIFE' });
  'BULLS'.split('').forEach((c, i) => title.append(h('span', { style: `animation-delay:${i * 0.12}s`, text: c })));
  'LIFE'.split('').forEach((c, i) => title.append(h('span', { class: 'gold', style: `animation-delay:${(i + 5) * 0.12}s`, text: c })));

  const click = (fn: () => void) => () => {
    play('click');
    fn();
  };
  const btn = (ico: string, label: string, cls: string, fn: () => void) => h('button', { class: `btn ${cls}`, onclick: click(fn) }, h('span', { class: 'ico', text: ico }), label);

  const preview = h('canvas', { width: 240, height: 360, 'aria-label': 'Your character' });
  const nameEl = h('div', { class: 'name' });
  let frame = 0;
  const drawCard = () => {
    drawPreview(preview, session.appearance, 'front', 1 + (frame++ % 4));
    nameEl.textContent = session.appearance.name;
  };
  drawCard();
  const timer = setInterval(drawCard, 170);

  const card = h(
    'div',
    { class: 'char-card' },
    preview,
    nameEl,
    h('div', { class: 'hint', text: session.isNewPlayer ? 'New student? Customize your look!' : 'Ready for class?' }),
    h('button', { class: 'btn ghost small', style: 'margin-top:10px', onclick: click(actions.character), text: '🎨 Edit look' }),
  );

  const modePill = ONLINE_ENABLED
    ? h('span', { class: 'pill ok' }, h('span', { class: 'dot' }), 'Online multiplayer')
    : h('span', { class: 'pill warn', title: 'Add Supabase keys to .env.local for cross-device play' }, h('span', { class: 'dot' }), 'Local mode · tabs on this device');

  const el = h(
    'div',
    { class: 'menu' },
    h(
      'div',
      {},
      title,
      h('p', { class: 'menu-sub', text: 'Your Campus. Your People. Your Story.' }),
      h(
        'div',
        { class: 'menu-buttons' },
        btn('▶', 'PLAY', 'gold play', actions.play),
        btn('🎨', 'MY CHARACTER', 'light', actions.character),
        btn('👥', 'FRIENDS', 'light', actions.friends),
        btn('⚙️', 'SETTINGS', 'light', actions.settings),
      ),
      h(
        'div',
        { class: 'menu-foot' },
        modePill,
        h('span', { class: 'pill', text: session.room === DEFAULT_ROOM ? '🏫 Public campus' : `🔒 Room: ${session.room}` }),
        h('span', { text: 'UB Hacking 2026' }),
      ),
    ),
    card,
  );
  uiRoot().append(el);
  const off = bus.on('appearance', drawCard);

  return {
    destroy() {
      clearInterval(timer);
      off();
      el.remove();
    },
  };
}
