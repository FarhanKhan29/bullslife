/** Separate histories and drafts for the room and each one-to-one conversation. */
import { CHAT } from '../core/config';
import { play } from '../core/audio';
import { bus, getNet, session } from '../core/session';
import { ChatRateLimiter, sanitizeMessage } from '../social/chatSafety';
import { isBlocked, isMuted, moderationEvents } from '../social/moderation';
import type { ChatMessage } from '../net/multiplayer';
import { h, isModalOpen, toast } from './dom';
import { openReport } from './panels';

type Entry = ChatMessage | { system: string };
interface Conversation {
  name: string;
  history: Entry[];
  draft: string;
  unread: number;
}

export function createChat(): { el: HTMLElement; destroy: () => void } {
  const net = getNet();
  const limiter = new ChatRateLimiter();
  const conversations = new Map<string, Conversation>();
  const roomName = () => session.friendsInvite ? '🔒 Friends chat' : '💬 Campus chat';
  let active = '';
  let collapsed = false;
  let sending = false;
  let roomRevision = 0;

  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' });
  const selector = h('select', { class: 'chat-scope', 'aria-label': 'Chat conversation' });
  const input = h('input', { maxlength: CHAT.maxLength, 'aria-label': 'Chat message', autocomplete: 'off' });
  const unreadEl = h('span', { class: 'unread', style: 'display:none' });
  const title = h('span', { class: 'chat-title' });
  const chev = h('span', { class: 'chev', text: '▾' });
  const head = h('button', { class: 'chat-head', 'aria-expanded': 'true', onclick: () => setCollapsed(!collapsed) }, title, unreadEl, chev);
  const sendButton = h('button', { class: 'btn small', type: 'submit', text: 'Send' });
  const form = h('form', { class: 'chat-form', onsubmit: (e: Event) => { e.preventDefault(); void send(); } }, input, sendButton);
  const el = h('div', { class: 'chat' }, head, selector, log, form);

  function conversation(id: string, name: string) {
    let state = conversations.get(id);
    if (!state) {
      const note = id
        ? 'Private chat. Only you and this guest can read these messages.'
        : session.friendsInvite
          ? 'Friends chat. Only people with the room invite can read these messages.'
          : 'Campus chat. Everyone in this room can read these messages.';
      state = { name, history: [{ system: note }], draft: '', unread: 0 };
      conversations.set(id, state);
    }
    return state;
  }

  function updateComposer() {
    const unavailable = net.status !== 'online' || (!!active && (!net.canMessage(active) || isBlocked(active)));
    sendButton.disabled = sending || unavailable;
    input.disabled = unavailable;
    input.placeholder = unavailable
      ? (net.status === 'online' ? 'Guest unavailable' : net.status === 'error' ? 'Connection unavailable' : 'Waiting for connection…')
      : active ? 'Message privately…' : session.friendsInvite ? 'Message friends…' : 'Message campus…';
  }

  function renderSelector() {
    let unread = 0;
    const options = [];
    for (const [id, state] of conversations) {
      unread += state.unread;
      const label = id ? `🔒 ${state.name}` : state.name;
      options.push(h('option', { value: id, text: state.unread ? `${label} (${state.unread})` : label }));
    }
    selector.replaceChildren(...options);
    selector.value = active;
    const label = conversations.get(active)!.name;
    title.textContent = active ? `🔒 ${label}` : label;
    unreadEl.style.display = unread ? '' : 'none';
    unreadEl.textContent = String(unread);
  }

  function setCollapsed(value: boolean) {
    collapsed = value;
    el.classList.toggle('collapsed', value);
    head.setAttribute('aria-expanded', String(!value));
    chev.textContent = value ? '▸' : '▾';
    if (!value) {
      conversations.get(active)!.unread = 0;
      renderSelector();
      log.scrollTop = log.scrollHeight;
    }
  }

  function switchConversation(id: string) {
    if (!conversations.has(id)) return;
    conversations.get(active)!.draft = input.value;
    active = id;
    const state = conversations.get(id)!;
    input.value = state.draft;
    setCollapsed(false);
    updateComposer();
    renderAll();
  }

  selector.addEventListener('change', () => switchConversation(selector.value));

  function renderMsg(m: Entry) {
    if ('system' in m) return h('div', { class: 'msg system', text: m.system });
    const who = h('span', { class: 'who', text: m.name + ': ', title: m.self ? 'You' : 'Click to report' });
    if (!m.self) who.addEventListener('click', () => openReport(m.id, m.name));
    return h('div', { class: 'msg' + (m.self ? ' self' : '') }, who, m.text);
  }

  function renderAll() {
    const state = conversations.get(active)!;
    log.replaceChildren(...state.history.filter((m) => 'system' in m || !isMuted(m.id)).map(renderMsg));
    log.scrollTop = log.scrollHeight;
  }

  function push(id: string, m: Entry) {
    if ('id' in m && isMuted(m.id)) return;
    const state = conversations.get(id)!;
    state.history.push(m);
    if (state.history.length > CHAT.historyMax) state.history.shift();
    if (id !== active || collapsed) {
      if (!('self' in m && m.self)) state.unread++;
      renderSelector();
    }
    if (id !== active) return;
    const atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
    log.append(renderMsg(m));
    while (log.children.length > CHAT.historyMax) log.firstElementChild?.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
  }

  async function send() {
    if (sending || input.disabled || isModalOpen()) return;
    const draft = input.value;
    const text = sanitizeMessage(draft);
    if (!text) return;
    const check = limiter.check(text);
    if (!check.ok) {
      toast(check.reason, 'warn', 2000);
      play('error');
      return;
    }
    const id = active;
    const revision = roomRevision;
    const encrypted = !!id || !!session.friendsInvite;
    sending = true;
    updateComposer();
    const msg = encrypted ? await net.sendPrivateChat(text, id || null) : net.sendChat(text);
    sending = false;
    updateComposer();
    if (revision !== roomRevision) return;
    if (!msg) {
      toast('Message could not be sent. Your draft is still here.', 'warn');
      return;
    }
    limiter.record(text);
    push(id, msg);
    if (!encrypted) bus.emit('localChat', text);
    play('chat');
    const state = conversations.get(id)!;
    if (state.draft === draft) state.draft = '';
    if (id === active && input.value === draft) input.value = '';
  }

  function resetRoom() {
    roomRevision++;
    conversations.clear();
    active = '';
    input.value = '';
    conversation('', roomName());
    renderSelector();
    renderAll();
    updateComposer();
  }

  const onKey = (e: KeyboardEvent) => {
    if (isModalOpen()) return;
    const focused = document.activeElement;
    if (e.key === 'Enter' && (focused === document.body || focused?.tagName === 'CANVAS')) {
      e.preventDefault();
      setCollapsed(false);
      input.focus();
    } else if (e.key === 'Escape' && (focused === input || focused === selector)) {
      (focused as HTMLElement).blur();
    }
  };
  window.addEventListener('keydown', onKey);

  const offs = [
    bus.on('roomChanged', resetRoom),
    bus.on('openDirectChat', (id, name) => {
      if (!net.canMessage(id) || isBlocked(id)) return;
      conversation(id, name);
      switchConversation(id);
      input.focus();
    }),
    net.on('players', updateComposer),
    net.on('status', updateComposer),
    net.on('chat', (m) => {
      push('', m);
      if (!isMuted(m.id)) play('chat');
    }),
    net.on('privateChat', (peerId, m) => {
      if (isMuted(m.id)) return;
      if (peerId) conversation(peerId, m.name);
      push(peerId ?? '', m);
      play('chat');
    }),
    net.on('joined', (name) => {
      push('', { system: `${name} joined 👋` });
      play('join');
    }),
    net.on('left', (name) => push('', { system: `${name} left.` })),
    moderationEvents.on('change', () => { renderAll(); updateComposer(); }),
  ];
  resetRoom();
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
