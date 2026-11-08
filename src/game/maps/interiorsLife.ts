/** Interiors of residence halls, sports venues, arts and dining. */
import { Room } from './interiorKit';
import type { ItemId, MapDef } from './types';

const DORM = { wall: '#efe7d8', wallSide: '#e3d9c6', trim: '#9a4a36', base: '#c9a882' };

/** Ellicott Complex — two dorm rooms, lounge with TV + ping-pong, laundry. */
export function ellicottInterior(): MapDef {
  const r = new Room('ellicott', 18, 14, 'carpet', {
    ...DORM,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 0.8, w: 2, z: 40, h: 46, kind: 'window' },
      { wall: 'n', u: 3.6, w: 1.6, z: 50, h: 34, kind: 'poster', color: '#7a5cd6', text: ['UB', 'BULLS'] },
      { wall: 'n', u: 8, w: 6, z: 70, h: 20, kind: 'sign', color: '#9a4a36', text: ['ELLICOTT · RED JACKET QUAD'] },
      { wall: 'n', u: 8.6, w: 3, z: 30, h: 34, kind: 'board' },
      { wall: 'w', u: 1, w: 1.6, z: 50, h: 34, kind: 'poster', color: '#d94b4b', text: ['ROOM', '204'] },
      { wall: 'w', u: 7.8, w: 1.6, z: 50, h: 34, kind: 'poster', color: '#3fae6b', text: ['ROOM', '206'] },
      { wall: 'w', u: 10, w: 2, z: 40, h: 46, kind: 'window' },
    ],
  });
  // room 204 (north-west) and room 206 (south-west) behind partitions with door gaps
  r.partition(0, 5.6, 6, true).partition(6, 0, 2, false).partition(6, 3.2, 2.4, false);
  r.partition(0, 6.6, 6, true).partition(6, 6.6, 2.4, false).partition(6, 10.2, 2.8, false);
  r.floor(0, 0, 6, 5, 'wood').floor(0, 7, 6, 13, 'wood');
  r.bed(1, 1.6, 'blue').bed(4.8, 1.6, 'red');
  r.add('desk_lamp', 1.4, 4.5, { rect: [1.4, 0.7] });
  r.seat('seatn_blue', 1.4, 5.1, 'back');
  r.add('desk_pc', 4.4, 4.5, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Video-call home' } });
  r.bed(1, 8.6, 'green').bed(4.8, 8.6, 'gold');
  r.add('desk_books', 1.4, 11.6, { rect: [1.4, 0.7] });
  r.seat('chair_gold', 1.4, 10.9, 'front');
  r.seat('beanbag_purple', 4.4, 11.6, 'front');
  r.stamp(3, 3.2, 'Make yourself at home in room 204', 1.3);
  // lounge
  r.add('tv_stand', 13, 6.4, { rect: [1.6, 0.5], act: { kind: 'use', use: 'tv', label: 'Watch TV' } });
  r.seat('couch_x', 13, 4, 'front');
  r.map.colliders.push({ kind: 'rect', x0: 12, y0: 3.6, x1: 14, y1: 4.4 });
  r.seat('beanbag_orange', 11, 5.2, 'front');
  r.add('pingpong', 13, 9.6, { rect: [1.6, 0.9], act: { kind: 'use', use: 'pingpong', label: 'Play ping-pong' } });
  // laundry corner
  for (const y of [1, 1.8, 2.6]) r.add('washer', 17.2, y, { rect: [0.7, 0.7], act: { kind: 'use', use: 'laundry', label: 'Do laundry' } });
  r.link(15.2, 11.9, 'Walk to Ellicott Food Court', 'ellicott-food');
  r.link(7.1, 1.5, 'Walk to C3 · Red Jacket', 'crossroads', { x: 5.2, y: 13.9 });
  return r.done();
}

/** Governors — common room with a piano, plus a dorm room. */
export function governorsInterior(): MapDef {
  const r = new Room('governors', 16, 13, 'wood', {
    ...DORM,
    wallHeight: 120,
    floorDecor: [{ kind: 'rug', x0: 8, y0: 4, x1: 14, y1: 9, color: '#7a4434', border: '#e8bd3a' }],
    items: [
      { wall: 'n', u: 7, w: 2.4, z: 40, h: 46, kind: 'window' },
      { wall: 'n', u: 10.4, w: 4.5, z: 70, h: 20, kind: 'sign', color: '#7a4434', text: ['GOVERNORS COMMON ROOM'] },
      { wall: 'n', u: 11, w: 3, z: 26, h: 36, kind: 'board' },
      { wall: 'w', u: 8, w: 3, z: 40, h: 40, kind: 'art', color: '#3e7aa8' },
    ],
  });
  // dorm room (north-west)
  r.partition(0, 6, 5.6, true).partition(5.6, 0, 2.2, false).partition(5.6, 3.6, 2.4, false);
  r.floor(0, 0, 6, 6, 'carpet');
  r.bed(1, 1.8, 'purple').bed(4.4, 1.8, 'blue');
  r.add('desk_lamp', 2.8, 5.1, { rect: [1.4, 0.7] });
  r.seat('chair_blue', 2.8, 4.4, 'front');
  // common room
  r.add('piano', 13.6, 2.4, { rect: [1.4, 1.2], act: { kind: 'use', use: 'piano', label: 'Play the piano' } });
  r.stamp(12.2, 2.6, 'Sign the common-room guest book', 1);
  r.seat('couch_x', 11, 5.2, 'front');
  r.map.colliders.push({ kind: 'rect', x0: 10, y0: 4.8, x1: 12, y1: 5.6 });
  r.add('coffee_table', 11, 6.8, { rect: [1, 0.8] });
  r.seat('armchair_gold', 9.2, 8.2, 'back');
  r.seat('armchair_blue', 12.8, 8.2, 'back');
  r.add('tv_stand', 11, 10.2, { rect: [1.6, 0.5], act: { kind: 'use', use: 'tv', label: 'Watch the game' } });
  r.add('shelf_y', 15.4, 7, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Borrow a board game' } });
  r.add('table_round', 3, 9.6, { r: 0.55 });
  r.seat('chair_gold', 3, 8.75, 'front');
  r.seat('seatn_gold', 3, 10.45, 'back');
  r.link(12.1, 11, 'Walk to Governors Dining Center', 'governors-dining');
  r.wall({ wall: 'w', u: 6.1, w: 3.5, z: 64, h: 18, kind: 'sign', color: '#005bbb', text: ['TEDDY’S · ROOSEVELT'] });
  r.add('store_shelf_b', 1.3, 7.4, { rect: [1.6, 0.5] });
  r.counter('teddys', 3.6, 7.3, 'Pay at Teddy’s');
  return r.done();
}

/** Greiner public spaces connect to the residential suites upstairs. */
export function greinerInterior(): MapDef {
  const r = new Room('greiner', 16, 13, 'wood', {
    ...DORM, wall: '#f4f1ea', wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 6.5, z: 70, h: 21, kind: 'sign', color: '#005bbb', text: ['BULLS ON THE RUN'] },
      { wall: 'n', u: 9, w: 5.5, z: 28, h: 62, kind: 'window' },
      { wall: 'w', u: 5.5, w: 4, z: 30, h: 50, kind: 'window' },
    ],
  });
  r.add('station_cafe', 3.1, 2.1, { rect: [2.2, 0.9] });
  r.counter('greiner', 4.5, 4.7, 'Order at Bulls on the Run');
  r.add('kitchen', 12.7, 1.5, { rect: [2.4, 0.7], act: { kind: 'take', item: 'noodles', label: 'Cook ramen in the shared kitchen' }, reach: 1.6 });
  r.stamp(10.7, 8.2, 'Visit the Greiner study lounge', 1.15);
  r.add('reading_table', 12.1, 6.5, { rect: [2.4, 1] }).chairsNS(12.1, 6.5);
  r.seat('couch_x', 12.5, 9.8, 'front');
  r.add('table_round', 3.1, 8.5, { r: 0.55 }).chairsNS(3.1, 8.5);
  r.link(6.1, 10.7, 'Stairs to residence suites', 'greiner-suite');
  return r.done();
}

export function greinerSuiteInterior(): MapDef {
  const r = new Room('greiner-suite', 13, 10, 'carpet', DORM)
    .exitTo('Greiner Hall · Residence Suite', 'greiner', { x: 7.7, y: 10.6 });
  r.partition(6.5, 0, 5.6, false);
  r.partition(0, 6.8, 4.3, true).partition(8.7, 6.8, 4.3, true);
  r.floor(5, 6, 8, 8, 'tile');
  r.info('bath', 6.5, 6.6, 'Shared bathroom', 'Two double bedrooms share the suite bathroom.', 1.1);
  for (const offset of [0, 6.5]) {
    r.bed(offset + 1.1, 1.7, 'blue').bed(offset + 5.2, 1.7, 'gold');
    r.add('desk_books', offset + 1.4, 4.8, { rect: [1.4, 0.7] });
    r.add('desk_lamp', offset + 4.9, 4.8, { rect: [1.4, 0.7] });
  }
  return r.done();
}

/** Alumni Arena — basketball court, hoops, bleachers, trophy case. */
export function arenaInterior(): MapDef {
  const r = new Room('arena', 22, 16, 'court', {
    wall: '#e4e7ea',
    wallSide: '#d6dade',
    trim: '#005bbb',
    wallHeight: 150,
    floorDecor: [{ kind: 'court', x0: 2, y0: 4, x1: 20, y1: 13 }],
    items: [
      { wall: 'n', u: 7, w: 8, z: 90, h: 40, kind: 'scoreboard', text: ['BULLS', 'HOME 78 — 72 GUEST'] },
      { wall: 'n', u: 1, w: 5, z: 96, h: 24, kind: 'banner', color: '#005bbb', text: ['MAC CHAMPIONS'] },
      { wall: 'n', u: 16, w: 5, z: 96, h: 24, kind: 'banner', color: '#005bbb', text: ['GO BULLS!'] },
      { wall: 'w', u: 2, w: 10, z: 70, h: 24, kind: 'banner', color: '#ffffff', text: ['ALUMNI ARENA'] },
    ],
  });
  r.add('hoop_w', 2.3, 8.5, { r: 0.3, act: { kind: 'use', use: 'hoop', label: 'Shoot a basket', target: { x: 2.7, y: 8.5 } }, reach: 5 });
  r.add('hoop_e', 19.7, 8.5, { r: 0.3, act: { kind: 'use', use: 'hoop', label: 'Shoot a basket', target: { x: 19.3, y: 8.5 } }, reach: 5 });
  for (const x of [4, 9, 14]) {
    r.add('bleacher_x', x + 1.5, 1.6, { rect: [3, 1.5] });
    for (const dx of [0.5, 1.5, 2.5]) r.map.props.push({ tex: '', gx: x + dx, gy: 1.6, act: { kind: 'sit', facing: 'front' }, reach: 1 });
  }
  r.add('trophy_case', 19.5, 1.2, { rect: [1.6, 0.5] });
  r.stamp(19.5, 2.2, 'Check out the trophy case', 1.2);
  r.add('vend_b', 0.6, 14, { rect: [1, 0.8], act: { kind: 'checkout', shop: 'drinks', label: 'Buy a sports drink' } });
  r.add('vend_a', 0.6, 2.4, { rect: [1, 0.8], act: { kind: 'take', item: 'basketball', label: 'Borrow a basketball', text: '🏀 You grabbed a ball from the rack.' } });
  return r.done();
}

/** UB Stadium — football field with yard lines, goalposts and stands. */
export function stadiumInterior(): MapDef {
  const r = new Room('stadium', 24, 18, 'turf', {
    wall: '#c9c4ba',
    wallSide: '#bdb8ae',
    trim: '#005bbb',
    wallHeight: 110,
    floorDecor: [{ kind: 'field', x0: 2, y0: 4, x1: 22, y1: 15 }],
    items: [
      { wall: 'n', u: 8, w: 8, z: 56, h: 40, kind: 'scoreboard', text: ['UB BULLS', 'HOME 21 — 14 VISITOR'] },
      { wall: 'n', u: 1, w: 6, z: 60, h: 24, kind: 'banner', color: '#005bbb', text: ['HORNS UP!'] },
      { wall: 'n', u: 17, w: 6, z: 60, h: 24, kind: 'banner', color: '#005bbb', text: ['GO BULLS!'] },
    ],
  });
  r.add('goalpost', 2.6, 9.5, { r: 0.2 });
  r.add('goalpost', 21.4, 9.5, { r: 0.2 });
  r.map.props.push({ tex: '', gx: 6, gy: 9.5, act: { kind: 'use', use: 'kick', label: 'Kick a field goal (west)', target: { x: 2.6, y: 9.5 } }, reach: 1.5 });
  r.map.props.push({ tex: '', gx: 18, gy: 9.5, act: { kind: 'use', use: 'kick', label: 'Kick a field goal (east)', target: { x: 21.4, y: 9.5 } }, reach: 1.5 });
  for (const x of [3, 7.5, 12, 16.5]) {
    r.add('bleacher_x', x + 2, 1.6, { rect: [4, 1.5] });
    for (const dx of [0.6, 2, 3.4]) r.map.props.push({ tex: '', gx: x + dx, gy: 1.6, act: { kind: 'sit', facing: 'front' }, reach: 1 });
  }
  r.add('desk_lamp', 15, 16.4, { rect: [1.4, 0.7] }).stamp(15, 15.5, 'Visit the Bulls ticket booth', 1.2);
  r.add('vend_a', 22.8, 16.4, { rect: [1, 0.8], act: { kind: 'take', item: 'football', label: 'Grab a football', text: '🏈 You picked up a football.' } });
  return r.done();
}

/** Center for the Arts: skylit public atrium with separate theatre and gallery entrances. */
export function cfaInterior(): MapDef {
  const r = new Room('cfa', 20, 15, 'tile', {
    wall: '#efece8', wallSide: '#dae4eb', trim: '#667c91', wallHeight: 165,
    items: [
      { wall: 'n', u: 2, w: 16, z: 75, h: 73, kind: 'window' },
      { wall: 'n', u: 5, w: 10, z: 51, h: 23, kind: 'sign', color: '#26496c', text: ['CENTER FOR THE ARTS · ATRIUM'] },
      { wall: 'w', u: 2, w: 9, z: 36, h: 68, kind: 'window' },
    ],
  });
  r.add('info_desk', 10, 3, { rect: [4, 1] }).stamp(10, 4.2, 'Check in at the Atrium information desk');
  r.link(4.3, 7.3, 'Enter Mainstage Theatre', 'cfa-mainstage');
  r.link(15.7, 7.3, 'Enter UB Art Gallery', 'cfa-gallery');
  r.seat('couch_x', 5, 11.4, 'front');
  r.seat('couch_x', 15, 11.4, 'front');
  return r.done();
}

export function cfaMainstageInterior(): MapDef {
  const r = new Room('cfa-mainstage', 18, 14, 'carpet', {
    wall: '#2b2233',
    wallSide: '#241d2b',
    trim: '#7a5cd6',
    base: '#3b2f45',
    wallHeight: 140,
    floorDecor: [{ kind: 'stage', x0: 3, y0: 0, x1: 15, y1: 4 }],
    items: [
      { wall: 'n', u: 3, w: 1.6, z: 0, h: 130, kind: 'banner', color: '#8a1f2b', text: [''] },
      { wall: 'n', u: 13.4, w: 1.6, z: 0, h: 130, kind: 'banner', color: '#8a1f2b', text: [''] },
      { wall: 'n', u: 5.5, w: 7, z: 100, h: 22, kind: 'sign', color: '#7a5cd6', text: ['CENTER FOR THE ARTS · MAINSTAGE'] },
      { wall: 'w', u: 6, w: 2.4, z: 40, h: 40, kind: 'art', color: '#f2a93b' },
      { wall: 'w', u: 9.4, w: 2.4, z: 40, h: 40, kind: 'art', color: '#3fae6b' },
    ],
  });
  r.add('piano', 6, 2, { rect: [1.4, 1.2], act: { kind: 'use', use: 'piano', label: 'Play the grand piano' } });
  r.add('drums', 11.6, 1.8, { r: 0.7, act: { kind: 'use', use: 'drums', label: 'Play the drums' } });
  r.exitTo('Center for the Arts · Mainstage', 'cfa', { x: 5.7, y: 8.5 });
  r.info('stage', 9, 3.4, 'Take a bow on the stage', 'Welcome to the Mainstage.', 1.2);
  for (const y of [6, 7.4, 8.8, 10.2]) {
    for (let x = 4; x <= 7.5; x += 0.9) r.seat('seatn_purple', x, y, 'back');
    for (let x = 10.5; x <= 14; x += 0.9) r.seat('seatn_purple', x, y, 'back');
  }
  return r.done();
}

export function cfaGalleryInterior(): MapDef {
  const r = new Room('cfa-gallery', 14, 12, 'wood', {
    wall: '#f8f7f2', wallSide: '#eeece6', trim: '#364766', wallHeight: 125,
    items: [
      { wall: 'n', u: 1.4, w: 3.2, z: 34, h: 49, kind: 'art', color: '#e8ad6e' },
      { wall: 'n', u: 6, w: 2.8, z: 34, h: 45, kind: 'art', color: '#1f5b84' },
      { wall: 'n', u: 10, w: 2.6, z: 34, h: 48, kind: 'art', color: '#96464d' },
    ],
  }).exitTo('UB Art Gallery · Center for the Arts', 'cfa', { x: 14.3, y: 8.5 });
  r.add('easel', 11.2, 5.2, { r: 0.35, act: { kind: 'use', use: 'easel', label: 'Sketch in the gallery' } });
  r.add('sculpture', 1.6, 10.2, { r: 0.4, act: { kind: 'use', use: 'info', label: 'Read the exhibit card', text: '🖼️ Student exhibition: “Lake Effect” — paintings of Buffalo winters.' } });
  return r.done();
}

/** The Commons is a retail arcade off Lee Road. The Bookstore is next door. */
export function commonsInterior(): MapDef {
  const r = new Room('commons', 19, 13, 'tile', {
    wall: '#f4f1ea', wallSide: '#e9e5dc', trim: '#96464d', wallHeight: 105,
    items: [
      { wall: 'n', u: 1, w: 6.5, z: 62, h: 22, kind: 'sign', color: '#27784c', text: ['SUBWAY · SUITE 303'] },
      { wall: 'n', u: 11.3, w: 6.5, z: 62, h: 22, kind: 'sign', color: '#b14736', text: ['YOUNG CHOW · SUITE 302'] },
      { wall: 'w', u: 4, w: 5, z: 30, h: 50, kind: 'window' },
    ],
  });
  r.partition(9.5, 0, 5.4, false);
  r.add('station_salad', 3.4, 2.1, { rect: [2.2, 0.9] });
  r.add('station_asian', 14.9, 2.1, { rect: [2.2, 0.9] });
  r.counter('subway', 5.5, 5.2, 'Order at Subway');
  r.counter('youngChow', 13.8, 5.2, 'Order at Young Chow');
  r.stamp(9.5, 7.5, 'Check in at The Commons arcade', 1.15);
  for (const x of [3.4, 15.8]) {
    r.add('table_round', x, 9.5, { r: 0.55 });
    r.chairsNS(x, 9.5);
  }
  return r.done();
}

/** C3 at Red Jacket Quad: cashier before the dining floor, stations around seating. */
export function crossroadsInterior(): MapDef {
  const r = new Room('crossroads', 24, 17, 'tile', {
    wall: '#efe7da', wallSide: '#e2d8c8', trim: '#b6813d', wallHeight: 128,
    items: [
      { wall: 'n', u: 1, w: 21.5, z: 91, h: 24, kind: 'sign', color: '#3b2a1e', text: ['CROSSROADS CULINARY CENTER · RED JACKET QUAD'] },
      { wall: 'w', u: 2, w: 5, z: 30, h: 58, kind: 'window' },
      { wall: 'w', u: 8, w: 4, z: 30, h: 58, kind: 'window' },
    ],
  });
  const stations: [string, number, number, ItemId, string][] = [
    ['station_pizza', 2.4, 2, 'pizza', 'Oreganos · Pizza'],
    ['station_grill', 6.2, 2, 'wings', 'Carve · Chicken'],
    ['station_asian', 10, 2, 'noodles', 'Global Noodle · Noodles'],
    ['station_salad', 13.8, 2, 'salad', 'Strictly Vegetarian · Salad'],
    ['station_grill', 17.6, 2, 'burger', 'Foundations 1846 · Burger'],
    ['station_asian', 21.3, 2, 'rice', 'Blue Dragon · Rice bowl'],
    ['station_dessert', 21.3, 7.2, 'icecream', 'Temptations · Dessert'],
  ];
  for (const [tex, x, y, item, label] of stations) {
    r.add(tex, x, y, { rect: [2.2, 0.9], act: { kind: 'take', item, label, buffet: true }, reach: 1.8 });
  }
  for (const y of [6.1, 9.4]) for (const x of [4.5, 9.3, 14.2, 18.6]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.chairsNS(x, y);
  }
  r.partition(0, 12.5, 9.5, true).partition(15.7, 12.5, 8.3, true);
  r.counter('crossroads', 12, 13, 'Pay or swipe at the C3 entrance');
  r.stamp(15.3, 14.5, 'Check in at the C3 entrance', 1.1);
  r.link(3.5, 14.9, 'Walk to Ellicott Food Court', 'ellicott-food', { x: 5, y: 11.2 });
  return r.done();
}
