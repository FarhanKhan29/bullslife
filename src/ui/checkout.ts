import { play } from '../core/audio';
import { inventory, type Payment } from '../game/inventory';
import { isFood, ITEM_NAMES, ITEMS } from '../game/items';
import { DINING_ADMISSION, MEAL_PLANS, SHOPS, type ShopId } from '../game/shops';
import { drawPreview } from '../character/avatarRenderer';
import { getNet, session } from '../core/session';
import { closeModal, h, openModal, toast } from './dom';

const PAYMENT_NAMES: Record<Payment, string> = { cash: 'Campus Cash', points: 'Dining Points', swipes: 'meal swipe' };

function walletSummary() {
  const { cash, points, swipes } = inventory.wallet;
  return `${cash} Campus Cash · ${points} Dining Points · ${swipes} meal swipe${swipes === 1 ? '' : 's'}`;
}

/** Stable pretend numbers for the in-game card, derived from the guest id. */
function cardNumbers() {
  let hash = 7;
  for (const ch of getNet().selfId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const digits = String(hash).padStart(10, '0');
  return { person: digits.slice(0, 8), card: `BULL 2026 ${digits.slice(0, 4)} ${digits.slice(4, 8)}` };
}

/** A decorative seal for the card background (original drawing). */
function cardSeal() {
  const seal = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  seal.setAttribute('viewBox', '0 0 200 200');
  seal.setAttribute('class', 'ubcard-seal');
  seal.setAttribute('aria-hidden', 'true');
  seal.innerHTML = `
    <defs><path id="ubcard-ring" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0"/></defs>
    <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="5"/>
    <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" stroke-width="3"/>
    <text font-family="Georgia, serif" font-size="17" font-weight="700" fill="currentColor" letter-spacing="3">
      <textPath href="#ubcard-ring">UNIVERSITY AT BUFFALO · FOUNDED 1846 ·</textPath>
    </text>
    <path fill="currentColor" d="M64 92c-9-5-13-16-9-26 3 9 10 13 19 14 7-5 18-8 27-8s20 3 27 8c9-1 16-5 19-14 4 10 0 21-9 26-1 7-4 13-8 18l-5 20c-2 8-9 13-17 13h-14c-8 0-15-5-17-13l-5-20c-4-5-7-11-8-18z"/>`;
  return seal;
}

export function openWallet() {
  const { person, card } = cardNumbers();
  const { cash, points, swipes } = inventory.wallet;
  const photo = h('canvas', { width: 240, height: 300, class: 'ubcard-photo', 'aria-label': 'Your student photo' });
  drawPreview(photo, session.appearance, 'front', 0);
  const balance = (value: number, label: string) => h('div', { class: 'ubcard-balance' }, h('b', { text: String(value) }), h('span', { text: label }));
  openModal({
    title: 'Your UB Card',
    icon: '🪪',
    body: h('div', {},
      h('div', { class: 'ubcard', role: 'img', 'aria-label': `In-game UB Card for ${session.appearance.name}` },
        cardSeal(),
        h('div', { class: 'ubcard-head' },
          h('div', { class: 'ubcard-mark', text: 'UB' }),
          h('div', {}, h('div', { class: 'ubcard-uni', text: 'University at Buffalo' }), h('div', { class: 'ubcard-suny', text: 'The State University of New York' })),
        ),
        h('div', { class: 'ubcard-main' },
          h('div', { class: 'ubcard-left' }, photo, h('div', { class: 'ubcard-role', text: 'STUDENT' })),
          h('div', { class: 'ubcard-info' },
            h('div', { class: 'ubcard-name', text: session.appearance.name.toUpperCase() }),
            h('div', { class: 'ubcard-line' }, 'PERSON # ', h('b', { text: person })),
            h('div', { class: 'ubcard-number', text: card }),
            h('div', { class: 'ubcard-site', text: 'BULLSLIFE' }),
          ),
        ),
        h('div', { class: 'ubcard-game', text: 'In-game card · not a valid ID' }),
      ),
      h('div', { class: 'ubcard-balances' }, balance(cash, 'Campus Cash'), balance(points, 'Dining Points'), balance(swipes, swipes === 1 ? 'Meal Swipe' : 'Meal Swipes')),
      h('div', { class: 'note', text: 'In-game balances. Buy a Meal Plan from the UB Card Office on the ground floor of Capen Hall.' }),
    ),
  });
}

export function openCheckout(id: ShopId, admit?: () => void) {
  const body = h('div');
  const balance = h('p', { class: 'checkout-balance', 'aria-live': 'polite', text: walletSummary() });
  const payButtons: { button: HTMLButtonElement; payment: Payment; cost: number; needsSlot: boolean }[] = [];
  const addButton = (label: string, payment: Payment, cost: number, needsSlot: boolean, action: () => boolean, success: string) => {
    const button = h('button', {
      class: 'btn small light',
      text: label,
      onclick: () => {
        if (!action()) {
          toast(needsSlot && !inventory.slots.includes(null) ? 'Inventory full. Make room before paying.' : 'Insufficient balance.', 'warn');
          return;
        }
        play('success');
        toast(success, 'success');
      },
    });
    payButtons.push({ button, payment, cost, needsSlot });
    return button;
  };
  const row = (label: string, ...buttons: HTMLButtonElement[]) => h(
    'div', { class: 'checkout-row' }, h('b', { text: label }), h('div', { class: 'row' }, ...buttons),
  );
  const payLabel = (amount: number, payment: Payment) => `${amount} ${PAYMENT_NAMES[payment]}`;
  const update = () => {
    balance.textContent = walletSummary();
    const full = !inventory.slots.includes(null);
    for (const { button, payment, cost, needsSlot } of payButtons) {
      button.disabled = (needsSlot && full) || inventory.wallet[payment] < cost;
      button.title = needsSlot && full ? 'Inventory full' : inventory.wallet[payment] < cost ? 'Insufficient balance' : '';
    }
  };

  body.append(balance);
  let title: string;
  if (id === 'mealPlans') {
    title = 'UB Card Office · 1Capen';
    body.append(h('p', { text: 'Buy an in-game Meal Plan with Campus Cash.' }));
    for (const plan of MEAL_PLANS) {
      body.append(row(`${plan.name} · ${plan.swipes} swipes + ${plan.points} Dining Points`, addButton(
        `Buy · ${payLabel(plan.price, 'cash')}`, 'cash', plan.price, false,
        () => inventory.buyPlan(plan.price, plan.swipes, plan.points), 'Meal Plan added to your UB Card.',
      )));
    }
  } else if (id === 'crossroads' || id === 'governorsDining') {
    title = id === 'crossroads' ? 'Crossroads Culinary Center' : 'Governors Dining Center';
    body.append(h('p', { text: 'Pay once at the entrance to visit the food stations.' }));
    const admitWith = (method: Payment, price: number) => {
      if (!admit || !inventory.pay(method, price)) return false;
      admit();
      closeModal();
      return true;
    };
    body.append(row('Dining hall admission', ...(['swipes', 'points', 'cash'] as const).map((method) => {
      const price = method === 'swipes' ? 1 : DINING_ADMISSION;
      const label = method === 'swipes' ? 'Swipe Meal Plan · 1 swipe' : `Pay · ${payLabel(price, method)}`;
      return addButton(label, method, price, false, () => admitWith(method, price), 'Welcome in! Choose a food station.');
    })));
  } else {
    const store = SHOPS[id];
    title = store.name;
    body.append(h('p', { text: 'Choose an item and how to pay.' }));
    for (const [item, price] of store.goods) {
      const methods: Payment[] = ['cash'];
      if ('dining' in store && isFood(item)) methods.push('points');
      if ('exchange' in store && price >= 5) methods.push('swipes');
      body.append(row(`${ITEMS[item]} ${ITEM_NAMES[item]}`, ...methods.map((method) => {
        const cost = method === 'swipes' ? 1 : price;
        return addButton(payLabel(cost, method), method, cost, true,
          () => inventory.buy(item, method, cost), `${ITEM_NAMES[item]} added to your inventory.`);
      })));
    }
    const fullHint = h('p', { class: 'note warn', text: 'Inventory full. Close checkout to eat or drop something.' });
    fullHint.hidden = inventory.slots.includes(null);
    body.append(fullHint);
  }
  update();
  const off = inventory.on('change', () => {
    update();
    const hint = body.querySelector<HTMLElement>('.note.warn');
    if (hint) hint.hidden = inventory.slots.includes(null);
  });
  openModal({ title, body, icon: '🧾', onClose: off });
}
