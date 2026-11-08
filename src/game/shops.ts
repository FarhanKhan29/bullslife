import type { ItemId } from './maps/types';

interface Store {
  name: string;
  goods: readonly (readonly [ItemId, number])[];
  dining?: boolean;
  exchange?: boolean;
}

export const SHOPS = {
  tims: { name: 'Tim Hortons · Student Union', goods: [['coffee', 3], ['bagel', 3], ['sandwich', 5]], dining: true, exchange: true },
  unionMarket: { name: 'Union Marketplace & Eatery', goods: [['wings', 6], ['burger', 6], ['sandwich', 5]], dining: true, exchange: true },
  moes: { name: "Moe’s · Student Union", goods: [['burrito', 6], ['rice', 6]], dining: true, exchange: true },
  campusTees: { name: 'Campus Tees', goods: [['ubtee', 10]] },
  unionUpstairs: { name: 'Bravo Pasta & Edgy Veggies · Floor 2', goods: [['noodles', 6], ['salad', 5]], dining: true, exchange: true },
  oneWorld: { name: 'One World Café', goods: [['rice', 6], ['noodles', 6], ['burger', 6]], dining: true, exchange: true },
  whispers: { name: 'Whispers Café · Silverman Library', goods: [['coffee', 3], ['bagel', 3]], dining: true, exchange: true },
  subway: { name: 'Subway · The Commons', goods: [['sandwich', 5], ['soda', 2]] },
  youngChow: { name: 'Young Chow · The Commons', goods: [['rice', 6], ['noodles', 6]] },
  bookstore: { name: 'University Bookstore', goods: [['book', 8], ['ubtee', 10], ['notebook', 4]] },
  elli: { name: 'The Elli · Ellicott Food Court', goods: [['chips', 2], ['soda', 2], ['notebook', 4]], dining: true },
  sizzles: { name: 'Sizzles · Ellicott Food Court', goods: [['burger', 6], ['wings', 6]], dining: true, exchange: true },
  teddys: { name: 'Teddy’s · Roosevelt Hall', goods: [['chips', 2], ['soda', 2], ['notebook', 4]], dining: true },
  greiner: { name: 'Bulls on the Run · Greiner Hall', goods: [['coffee', 3], ['sandwich', 5], ['salad', 5]], dining: true, exchange: true },
  snacks: { name: 'Snack vending machine', goods: [['chips', 2]], dining: true },
  drinks: { name: 'Drink vending machine', goods: [['soda', 2]], dining: true },
} satisfies Record<string, Store>;

export const MEAL_PLANS = [
  { name: 'Mini Meal Plan', price: 10, swipes: 2, points: 3 },
  { name: 'Campus Meal Plan', price: 18, swipes: 4, points: 6 },
] as const;

export const DINING_ADMISSION = 7;
export type ShopId = keyof typeof SHOPS | 'mealPlans' | 'crossroads' | 'governorsDining';
