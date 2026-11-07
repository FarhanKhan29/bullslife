/**
 * Campus chat panel (bottom-left). Messages are rendered with textContent
 * only, kept in memory for this session (never stored on a server).
 */
import { CHAT } from '../core/config';
import { play } from '../core/audio';
import { bus, getNet, session } from '../core/session';
import { ChatRateLimiter, sanitizeMessage } from '../social/chatSafety';
import { isMuted, moderationEvents } from '../social/moderation';
import type { ChatMessage } from '../net/multiplayer';
import { h, isModalOpen, toast } from './dom';
import { openReport } from './panels';

export function createChat(): { el: HTMLElement; destroy: () => void } {
  const limiter = new ChatRateLimiter();
  const history: (ChatMessage | { system: string })[] = [];
  let collapsed = false;
  let unread = 0;

  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' });
  const input = h('input', { maxlength: CHAT.maxLength, placeholder: 'Say hi… (Enter)', 'aria-label': 'Chat message', autocomplete: 'off' }) as HTMLInputElement;
  const unreadEl = h('span', { class: 'unread', style: 'display:none' });
  const chev = h('span', { class: 'chev', text: '▾' });
  const head = h('button', { class: 'chat-head', 'aria-expanded': 'true', onclick: () => setCollapsed(!collapsed) }, '💬 Campus chat', unreadEl, chev);
  const form = h(
    'form',
    { class: 'chat-form', onsubmit: (e: Event) => { e.preventDefault(); send(); } },
    input,
    h('button', { class: 'btn small', type: 'submit', text: 'Send' }),
  );
  const el = h('div', { class: 'chat' }, head, log, form);

  function setCollapsed(c: boolean) {
    collapsed = c;
    el.classList.toggle('collapsed', c);
    head.setAttribute('aria-expanded', String(!c));
    chev.textContent = c ? '▸' : '▾';
    if (!c) {
      unread = 0;
      renderUnread();
      log.scrollTop = log.scrollHeight;
    }
  }
  function renderUnread() {
    unreadEl.style.display = unread ? '' : 'none';
    unreadEl.textContent = String(unread);
  }

  function renderAll() {
    log.replaceChildren(...history.filter((m) => 'system' in m || !isMuted(m.id)).map(renderMsg));
    log.scrollTop = log.scrollHeight;
  }
  function renderMsg(m: ChatMessage | { system: string }) {
    if ('system' in m) return h('div', { class: 'msg system', text: m.system });
    const who = h('span', { class: 'who', text: m.name + ': ', title: m.self ? 'You' : 'Click to report' });
    if (!m.self) who.addEventListener('click', () => openReport(m.id, m.name));
    return h('div', { class: 'msg' + (m.self ? ' self' : '') }, who, m.text);
  }
  function push(m: ChatMessage | { system: string }) {
    history.push(m);
    if (history.length > CHAT.historyMax) history.shift();
    if ('id' in m && isMuted(m.id)) return;
    const atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
    log.append(renderMsg(m));
    while (log.children.length > CHAT.historyMax) log.firstElementChild?.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
    if (collapsed) {
      unread++;
      renderUnread();
    }
  }

  function send() {
    const text = sanitizeMessage(input.value);
    if (!text) return;
    const check = limiter.check(text);
    if (!check.ok) {
      toast(check.reason, 'warn', 2000);
      play('error');
      return;
    }
    limiter.record(text);
    const msg = getNet().sendChat(text);
    push(msg);
    bus.emit('localChat', text);
    play('chat');
    input.value = '';
  }

  // Enter focuses chat; Escape leaves it (so WASD walks again)
  const onKey = (e: KeyboardEvent) => {
    if (isModalOpen()) return;
    if (e.key === 'Enter' && document.activeElement !== input) {
      e.preventDefault();
      setCollapsed(false);
      input.focus();
    } else if (e.key === 'Escape' && document.activeElement === input) {
      input.blur();
    }
  };
  window.addEventListener('keydown', onKey);

  const net = getNet();
  const offs = [
    net.on('chat', (m) => {
      push(m);
      if (!isMuted(m.id)) play('chat');
    }),
    net.on('joined', (name) => {
      push({ system: `${name} joined the campus 👋` });
      play('join');
    }),
    net.on('left', (name) => push({ system: `${name} left.` })),
    moderationEvents.on('change', renderAll),
  ];
  push({ system: `Welcome to room “${session.room}”! Be kind — chat isn't saved after you leave.` });
  // small screens: keep the world visible, chat opens on tap / Enter
  if (window.innerWidth < 640) setCollapsed(true);

  return {
    el,
    destroy: () => {
      window.removeEventListener('keydown', onKey);
      offs.forEach((o) => o());
      el.remove();
    },
  };
}
