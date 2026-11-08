import { expect, it } from 'vitest';
import { PlayerInventory } from '../src/game/inventory';

it('consumes only the selected food and preserves tools and other slots', () => {
  const bag = new PlayerInventory();
  bag.take('pizza');
  bag.take('book');
  expect(bag.eat()).toBeNull();
  bag.select(0);
  expect(bag.eat()).toBe('pizza');
  expect(bag.slots).toEqual([null, 'book', null]);
});

it('keeps floor items across visits and swaps atomically when all slots are full', () => {
  const bag = new PlayerInventory();
  bag.take('coffee');
  bag.drop('union', 2, 3);
  bag.take('book');
  bag.take('notebook');
  bag.take('soda');
  expect(bag.dropsOn('capen')).toEqual([]);
  const [drop] = bag.dropsOn('union');
  expect(drop.item).toBe('coffee');
  expect(bag.pickUp('union', drop.id)).toEqual({ item: 'coffee', displaced: 'soda' });
  expect(bag.dropsOn('union')[0]).toMatchObject({ item: 'soda', x: 2, y: 3 });
  bag.select(0, true);
  expect(bag.slots).toEqual(['coffee', 'notebook', 'book']);
});

it('only charges for purchases when an item fits and grants the purchased meal plan', () => {
  const bag = new PlayerInventory();
  expect(bag.buy('sandwich', 'swipes', 1)).toBe(true);
  expect(bag.wallet.swipes).toBe(0);
  bag.take('coffee');
  bag.take('book');
  expect(bag.buy('chips', 'cash', 2)).toBe(false);
  expect(bag.wallet.cash).toBe(40);
  expect(bag.buyPlan(10, 2, 3)).toBe(true);
  expect(bag.pay('swipes', 1)).toBe(true);
  expect(bag.wallet).toEqual({ cash: 30, points: 7, swipes: 1 });
});
