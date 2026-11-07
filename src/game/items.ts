/** Holdable items and the flavour text for object interactions. */
import type { ItemId, UseKind } from './maps/types';

export const ITEMS: Record<ItemId, string> = {
  coffee: '☕',
  tea: '🍵',
  pizza: '🍕',
  burger: '🍔',
  salad: '🥗',
  sandwich: '🥪',
  soda: '🥤',
  chips: '🍟',
  icecream: '🍦',
  book: '📘',
  basketball: '🏀',
  football: '🏈',
  noodles: '🍜',
  wings: '🍗',
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const BOOK_TITLES = [
  '“Intro to Algorithms” — 1,312 pages of pure joy.',
  '“A History of Buffalo” — chapter 7: the Blizzard of ’77.',
  '“Organic Chemistry” — someone highlighted every single line.',
  '“The Great Gatsby” — a classic for your English seminar.',
  '“Calculus: Early Transcendentals” — with a coffee stain on page 214.',
  '“Engineering Mechanics: Statics” — Ketter Hall’s favourite.',
  '“Niagara Falls: Wonder of the World” — great photos!',
  '“How to Survive Finals Week” — surprisingly helpful.',
  '“Poetry Collection, 1940s” — the library holds a huge poetry archive.',
];

export const UB_FACTS = [
  'UB was founded in 1846 — Millard Fillmore was its first chancellor.',
  'North Campus is in Amherst; South Campus is in Buffalo, 3 miles away.',
  'The Stampede bus connects North and South Campus.',
  'Lake LaSalle is right in the middle of North Campus.',
  'The UB mascot is Victor E. Bull 🐂.',
  'Buffalo is famous for chicken wings and sponge candy.',
];

export function useFlavor(use: UseKind, custom?: string): string {
  if (custom) return custom;
  switch (use) {
    case 'book':
      return pick(BOOK_TITLES);
    case 'computer':
      return pick(['You checked UBlearns — no new assignments! 🎉', 'You submitted your lab report just before midnight. 😅', 'You registered for next semester’s classes. 🗓️', 'You looked up when the next Stampede bus leaves. 🚌']);
    case 'tv':
      return pick(['📺 Bulls football highlights are on!', '📺 Weather: lake-effect snow later this week ❄️', '📺 UB news: new labs open in Davis Hall.']);
    case 'printer':
      return '🖨️ 3D-printing a tiny Victor E. Bull… done! Looks great.';
    case 'laundry':
      return '🧺 Laundry started. 45 minutes left… time to study.';
    case 'microscope':
      return '🔬 You see tiny cells dividing. Science!';
    case 'robot':
      return '🤖 The robot arm waves back at you.';
    case 'easel':
      return '🎨 You painted a little sunset over Lake LaSalle.';
    case 'drums':
      return '🥁 Ba-dum-tss!';
    case 'shop':
      return pick(['🛍️ You bought a blue UB hoodie.', '🛍️ You picked up a UB mug and some pens.', '🛍️ You grabbed a new notebook for class.']);
    case 'info':
      return pick(UB_FACTS);
    default:
      return '';
  }
}
