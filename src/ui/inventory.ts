import { bus } from '../core/session';
import { inventory } from '../game/inventory';
import { isFood, ITEM_NAMES, ITEMS } from '../game/items';
import { openWallet } from './checkout';
import { h } from './dom';

export function createInventory() {
  let swapping = false;
  const slots = inventory.slots.map((_, index) => h('button', {
    class: 'inventory-slot',
    type: 'button',
    onclick: () => {
      const swap = swapping;
      swapping = false;
      inventory.select(index, swap);
      render();
    },
  }));
  const action = (label: string, title: string, onClick: () => void) =>
    h('button', { class: 'inventory-action', type: 'button', text: label, title, 'aria-label': title, onclick: onClick });
  const swap = action('↔', 'Swap selected slot', () => {
    swapping = !swapping;
    render();
  });
  const eat = action('Eat', 'Eat or drink selected item (F)', () => bus.emit('useItem'));
  const drop = action('Drop', 'Drop selected item (G)', () => bus.emit('dropItem'));
  const wallet = action('🪪', 'View UB Card balance', openWallet);
  const el = h('div', { class: 'inventory-bar', role: 'group', 'aria-label': 'Inventory' }, ...slots, swap, eat, drop, wallet);

  function render() {
    for (const [index, button] of slots.entries()) {
      const item = inventory.slots[index];
      const label = `${swapping && index !== inventory.selected ? 'Swap with' : 'Select'} slot ${index + 1}: ${item ? ITEM_NAMES[item] : 'Empty'}`;
      button.setAttribute('aria-label', label);
      button.title = `${label} (${6 + index})`;
      button.setAttribute('aria-pressed', String(index === inventory.selected));
      button.replaceChildren(h('small', { text: String(6 + index) }), item ? ITEMS[item] : '·');
    }
    const held = inventory.held;
    swap.setAttribute('aria-pressed', String(swapping));
    eat.disabled = !held || !isFood(held);
    drop.disabled = !held;
  }

  const off = inventory.on('change', render);
  render();
  return { el, destroy: off };
}
