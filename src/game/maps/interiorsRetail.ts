import { Room } from './interiorKit';
import type { ItemId, MapDef } from './types';

const DINING = { wall: '#eee9df', wallSide: '#dbe4ea', trim: '#005bbb', wallHeight: 115 };

export function unionDiningInterior(): MapDef {
  const r = new Room('union-dining', 16, 12, 'tile', DINING)
    .exitTo('Student Union · Floor 2', 'union', { x: 2.85, y: 13.5 });
  r.wall({ wall: 'n', u: 2, w: 12, z: 72, h: 23, kind: 'sign', color: '#005bbb', text: ['BRAVO PASTA  ·  EDGY VEGGIES'] });
  r.add('station_asian', 4.1, 2, { rect: [2.2, 0.9] });
  r.add('station_salad', 11.8, 2, { rect: [2.2, 0.9] });
  r.counter('unionUpstairs', 8, 4.4, 'Order pasta or a salad');
  for (const x of [3.8, 12.2]) {
    r.add('table_round', x, 7.5, { r: 0.55 });
    r.chairsNS(x, 7.5);
  }
  return r.done();
}

export function oneWorldInterior(): MapDef {
  const r = new Room('one-world', 21, 14, 'tile', { ...DINING, wallHeight: 150 })
    .exitTo('One World Café', 'capen', { x: 12.3, y: 8.8 });
  r.wall({ wall: 'n', u: 5, w: 11, z: 93, h: 25, kind: 'sign', color: '#005bbb', text: ['ONE WORLD CAFÉ'] });
  r.wall({ wall: 'w', u: 1, w: 10, z: 30, h: 85, kind: 'window' });
  r.add('station_grill', 4, 1.8, { rect: [2.2, 0.9] });
  r.add('station_asian', 9, 1.8, { rect: [2.2, 0.9] });
  r.add('station_salad', 14, 1.8, { rect: [2.2, 0.9] });
  r.counter('oneWorld', 17, 4, 'Order at One World Café');
  for (const [x, y] of [[4, 6], [8, 6], [12, 6], [4, 9.5], [8, 9.5], [14, 9.5]]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.chairsNS(x, y);
  }
  r.link(18, 10.5, 'Walk to Norton Hall', 'norton', { x: 10.5, y: 12.1 });
  return r.done();
}

export function ellicottFoodCourtInterior(): MapDef {
  const r = new Room('ellicott-food', 20, 15, 'tile', DINING)
    .exitTo('Ellicott Food Court', 'ellicott', { x: 13.7, y: 11.9 });
  r.wall({ wall: 'n', u: 1, w: 7, z: 65, h: 21, kind: 'sign', color: '#005bbb', text: ['THE ELLI'] });
  r.wall({ wall: 'n', u: 11, w: 7, z: 65, h: 21, kind: 'sign', color: '#d35d3d', text: ['SIZZLES'] });
  r.partition(7.5, 0, 6.4, false);
  r.add('store_shelf_b', 2, 2.5, { rect: [1.6, 0.5] });
  r.add('store_shelf_b', 2, 4.8, { rect: [1.6, 0.5] });
  r.add('store_shelf_b', 5, 3.3, { rect: [1.6, 0.5] });
  r.counter('elli', 5.3, 6.7, 'Pay at The Elli');
  r.add('station_grill', 13.4, 2.1, { rect: [2.2, 0.9] });
  r.counter('sizzles', 15, 4.8, 'Order at Sizzles');
  for (const [x, y] of [[11, 7.5], [16, 7.5], [12.5, 10.8]]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.chairsNS(x, y);
  }
  r.link(3.5, 11.2, 'Walk to C3 · Red Jacket', 'crossroads', { x: 5.2, y: 13.9 });
  return r.done();
}

export function governorsDiningInterior(): MapDef {
  const r = new Room('governors-dining', 17, 13, 'tile', DINING)
    .exitTo('Governors Dining Center', 'governors', { x: 10.6, y: 11 });
  r.wall({ wall: 'n', u: 2, w: 13, z: 70, h: 20, kind: 'sign', color: '#005bbb', text: ['GOVERNORS DINING CENTER'] });
  const stations: [string, number, ItemId, string][] = [
    ['station_pizza', 3.2, 'pizza', 'Pizza and pasta'],
    ['station_grill', 8.5, 'wings', 'Comfort Foods'],
    ['station_asian', 13.6, 'rice', 'International Station'],
  ];
  for (const [tex, x, item, label] of stations) {
    r.add(tex, x, 2.2, { rect: [2.2, 0.9], act: { kind: 'take', item, label, buffet: true }, reach: 1.7 });
  }
  r.counter('governorsDining', 7.2, 10.2, 'Pay or swipe at the entrance');
  for (const [x, y] of [[4, 5.8], [8.5, 5.8], [13, 5.8], [12, 9.1]]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.chairsNS(x, y);
  }
  return r.done();
}

export function bookstoreInterior(): MapDef {
  const r = new Room('bookstore', 18, 12, 'tile', DINING);
  r.wall({ wall: 'n', u: 1, w: 8, z: 67, h: 24, kind: 'sign', color: '#005bbb', text: ['UNIVERSITY BOOKSTORE'] });
  r.wall({ wall: 'n', u: 12, w: 5, z: 60, h: 21, kind: 'sign', color: '#364766', text: ['UB APPAREL'] });
  for (const x of [2.6, 5.6, 12.5, 15.5]) for (const y of [3.8, 6.5]) {
    r.add(x < 9 ? 'shelf_x' : 'store_shelf_a', x, y, { rect: [1.8, 0.5] });
  }
  r.counter('bookstore', 5.5, 9, 'Pay at the Bookstore checkout');
  return r.done();
}
