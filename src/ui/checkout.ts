import { play } from '../core/audio';
import { inventory, type Payment } from '../game/inventory';
import { isFood, ITEM_NAMES, ITEMS } from '../game/items';
import { DINING_ADMISSION, MEAL_PLANS, SHOPS, type ShopId } from '../game/shops';
import { closeModal, h, openModal, toast } from './dom';

const PAYMENT_NAMES: Record<Payment, string> = { cash: 'Campus Cash', points: 'Dining Points', swipes: 'meal swipe' };

function walletSummary() {
  const { cash, points, swipes } = inventory.wallet;
  return `${cash} Campus Cash · ${points} Dining Points · ${swipes} meal swipe${swipes === 1 ? '' : 's'}`;
}

export function openWallet() {
  openModal({
    title: 'Your UB Card',
    icon: '🪪',
    body: h('div', {}, h('p', { text: walletSummary() }), h('div', {
      class: 'note',
      text: 'In-game balances. Buy a Meal Plan from the UB Card Office on the ground floor of Capen Hall.',
    })),
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
