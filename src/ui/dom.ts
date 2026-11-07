/**
 * Minimal DOM helpers. All user-provided text goes through `textContent`
 * (never innerHTML), so chat messages and names can't inject HTML.
 */
type Attrs = Record<string, string | number | boolean | ((ev: any) => void) | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = String(v);
    else if (k === 'text') el.textContent = String(v);
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export const uiRoot = () => document.getElementById('ui')!;

let openPanelEl: HTMLElement | null = null;
let onCloseCb: (() => void) | null = null;

/** Opens a modal panel. Only one is open at a time. Escape closes it. */
export function openModal(opts: { title: string; body: Node; foot?: Node; wide?: boolean; onClose?: () => void; icon?: string }) {
  closeModal();
  const close = () => closeModal();
  const panel = h(
    'div',
    { class: 'panel' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title },
    h('div', { class: 'panel-head' }, opts.icon ? h('span', { style: 'font-size:24px', text: opts.icon }) : null, h('h2', { text: opts.title }), h('button', { class: 'x', 'aria-label': 'Close', onclick: close, text: '×' })),
    h('div', { class: 'panel-body' }, opts.body),
    opts.foot ? h('div', { class: 'panel-foot' }, opts.foot) : null,
  );
  const backdrop = h('div', { class: 'backdrop', onmousedown: (e: MouseEvent) => e.target === backdrop && close() }, panel);
  uiRoot().append(backdrop);
  openPanelEl = backdrop;
  onCloseCb = opts.onClose ?? null;
  (panel.querySelector('input, button.btn') as HTMLElement | null)?.focus({ preventScroll: true });
  return { close, panel };
}

export function closeModal() {
  if (!openPanelEl) return;
  openPanelEl.remove();
  openPanelEl = null;
  const cb = onCloseCb;
  onCloseCb = null;
  cb?.();
}

export function isModalOpen() {
  return !!openPanelEl;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openPanelEl) {
    e.preventDefault();
    closeModal();
  }
});

let toastBox: HTMLElement | null = null;
export function toast(text: string, kind: 'info' | 'success' | 'warn' = 'info', ms = 3200) {
  if (!toastBox || !toastBox.isConnected) {
    toastBox = h('div', { class: 'toasts', 'aria-live': 'polite' });
    uiRoot().append(toastBox);
  }
  const t = h('div', { class: `toast ${kind}`, text });
  toastBox.append(t);
  while (toastBox.children.length > 4) toastBox.firstElementChild?.remove();
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
