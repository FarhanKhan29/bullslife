/** Interiors of residence halls, sports venues, arts and dining. */
import { Room } from './interiorKit';
import type { MapDef } from './types';

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
  r.add('vend_b', 17.3, 11.5, { rect: [1, 0.8], act: { kind: 'eat', item: 'soda', label: 'Buy a drink', text: 'Midnight soda run. 🥤' } });
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
  return r.done();
}

/** Greiner Hall — modern suite: kitchen, dining table, two bedrooms, study lounge. */
export function greinerInterior(): MapDef {
  const r = new Room('greiner', 16, 13, 'wood', {
    wall: '#f4f1ea',
    wallSide: '#e9e5dc',
    trim: '#9a4a36',
    wallHeight: 120,
    items: [
      { wall: 'n', u: 0.6, w: 2.4, z: 40, h: 50, kind: 'window' },
      { wall: 'n', u: 3.4, w: 3, z: 64, h: 20, kind: 'sign', color: '#9a4a36', text: ['SUITE 3B'] },
      { wall: 'w', u: 6, w: 2, z: 40, h: 40, kind: 'art', color: '#f2a93b' },
    ],
  });
  r.add('kitchen', 3.2, 1.2, { rect: [2.4, 0.7], act: { kind: 'eat', item: 'noodles', label: 'Cook some ramen', text: '🍜 Instant ramen, chef’s kiss.' }, reach: 1.6 });
  r.stamp(3.2, 2.4, 'Cook dinner for your suitemates', 1.2);
  r.add('table_round', 3, 5, { r: 0.55 });
  r.seat('chair_blue', 3, 4.15, 'front');
  r.seat('seatn_blue', 3, 5.85, 'back');
  r.add('table_round', 5.2, 5.4, { r: 0.55 });
  r.seat('chair_gold', 5.2, 4.55, 'front');
  r.seat('seatn_gold', 5.2, 6.25, 'back');
  // study lounge
  r.add('study_table', 3.4, 9.4, { rect: [2, 0.9] });
  r.seat('seatn_blue', 3, 10.25, 'back');
  r.seat('seatn_blue', 3.9, 10.25, 'back');
  r.seat('couch_y', 6.4, 9.6, 'side');
  r.map.colliders.push({ kind: 'rect', x0: 6, y0: 8.6, x1: 6.8, y1: 10.6 });
  // bedrooms (east)
  r.partition(10, 0, 2.2, false).partition(10, 3.6, 2.4, false).partition(10, 6, 6, true);
  r.partition(10, 7, 2.2, false).partition(10, 10.6, 2.4, false).partition(10, 7, 6, true);
  r.floor(10, 0, 16, 6, 'carpet').floor(10, 7, 16, 13, 'carpet');
  r.bed(14.6, 1.6, 'gold').bed(14.6, 8.6, 'green');
  r.add('desk_pc', 12, 5.1, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Finish your essay' } });
  r.add('desk_books', 12, 12.1, { rect: [1.4, 0.7] });
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
  r.add('vend_b', 0.6, 14, { rect: [1, 0.8], act: { kind: 'eat', item: 'soda', label: 'Buy a sports drink', text: 'Hydrated and ready. 🥤' } });
  r.add('vend_a', 0.6, 2.4, { rect: [1, 0.8], act: { kind: 'eat', item: 'basketball', label: 'Borrow a basketball', text: '🏀 You grabbed a ball from the rack.' } });
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
  r.add('vend_a', 22.8, 16.4, { rect: [1, 0.8], act: { kind: 'eat', item: 'football', label: 'Grab a football', text: '🏈 You picked up a football.' } });
  return r.done();
}

/** Center for the Arts — theatre stage with piano & drums, seats, gallery. */
export function cfaInterior(): MapDef {
  const r = new Room('cfa', 18, 14, 'carpet', {
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
  r.stamp(9, 3.4, 'Take a bow on the stage', 1.2);
  for (const y of [6, 7.4, 8.8, 10.2]) {
    for (let x = 4; x <= 7.5; x += 0.9) r.seat('seatn_purple', x, y, 'back');
    for (let x = 10.5; x <= 14; x += 0.9) r.seat('seatn_purple', x, y, 'back');
  }
  r.add('easel', 1.4, 6.4, { r: 0.35, act: { kind: 'use', use: 'easel', label: 'Paint on the easel' } });
  r.add('sculpture', 1.6, 10.2, { r: 0.4, act: { kind: 'use', use: 'info', label: 'Read the exhibit card', text: '🖼️ Student exhibition: “Lake Effect” — paintings of Buffalo winters.' } });
  return r.done();
}

/** The Commons — campus store and café. */
export function commonsInterior(): MapDef {
  const r = new Room('commons', 16, 12, 'tile', {
    wall: '#f4f1ea',
    wallSide: '#e9e5dc',
    trim: '#d94b4b',
    wallHeight: 110,
    items: [
      { wall: 'n', u: 1, w: 6, z: 60, h: 22, kind: 'sign', color: '#005bbb', text: ['UB CAMPUS STORE'] },
      { wall: 'n', u: 9, w: 6, z: 60, h: 22, kind: 'menu', color: '#2b2f38', text: ['COFFEE  BAGELS  SMOOTHIES'] },
      { wall: 'w', u: 1, w: 4, z: 30, h: 50, kind: 'window' },
      { wall: 'w', u: 7, w: 3, z: 40, h: 36, kind: 'poster', color: '#005bbb', text: ['UB', 'GEAR'] },
    ],
  });
  for (const [x, y] of [
    [2, 3],
    [2, 5.4],
    [4.6, 3],
    [4.6, 5.4],
  ])
    r.add(y < 4 ? 'store_shelf_a' : 'store_shelf_b', x, y, { rect: [1.6, 0.5], act: { kind: 'use', use: 'shop', label: 'Browse UB gear' } });
  r.add('checkout', 3.4, 8, { rect: [1.4, 0.7] });
  r.stamp(3.4, 8.9, 'Buy something at the checkout', 1.2);
  r.add('station_cafe', 12, 1.4, { rect: [2.2, 0.9], act: { kind: 'eat', item: 'coffee', label: 'Order a latte', text: '☕ One oat-milk latte!' }, reach: 1.8 });
  for (const [x, y] of [
    [10.4, 5],
    [13.4, 5],
    [10.4, 8.4],
    [13.4, 8.4],
  ]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.seat('chair_blue', x, y - 0.85, 'front');
    r.seat('seatn_gold', x, y + 0.85, 'back');
  }
  return r.done();
}

/** Crossroads Culinary Center — dining hall with food stations. */
export function crossroadsInterior(): MapDef {
  const r = new Room('crossroads', 18, 14, 'tile', {
    wall: '#efe7da',
    wallSide: '#e2d8c8',
    trim: '#f2a93b',
    wallHeight: 120,
    items: [
      { wall: 'n', u: 0.5, w: 17, z: 90, h: 20, kind: 'sign', color: '#3b2a1e', text: ['CROSSROADS CULINARY CENTER'] },
      { wall: 'w', u: 2, w: 3, z: 30, h: 50, kind: 'window' },
      { wall: 'w', u: 7, w: 3, z: 30, h: 50, kind: 'window' },
    ],
  });
  const stations: [string, number, 'pizza' | 'burger' | 'salad' | 'noodles' | 'icecream' | 'wings', string, string][] = [
    ['station_pizza', 2, 'pizza', 'Grab a slice of pizza', '🍕 Hot slice of pepperoni!'],
    ['station_grill', 5, 'burger', 'Order from the grill', '🍔 Burger with Buffalo sauce.'],
    ['station_wings', 8, 'wings', 'Get Buffalo wings', '🍗 Wings, extra blue cheese. Very Buffalo.'],
    ['station_asian', 11, 'noodles', 'Get a noodle bowl', '🍜 Steaming noodle bowl.'],
    ['station_salad', 14, 'salad', 'Build a salad', '🥗 Fresh salad bowl.'],
  ];
  for (const [tex, x, item, label, text] of stations) r.add(tex, x + 0.6, 1, { rect: [2.2, 0.9], act: { kind: 'eat', item, label, text }, reach: 1.8 });
  r.add('station_dessert', 16.6, 4, { rect: [2.2, 0.9], act: { kind: 'eat', item: 'icecream', label: 'Get dessert', text: '🍦 Soft-serve with sprinkles.' }, reach: 1.8 });
  for (const y of [5, 8]) for (const x of [3, 6.4, 11.6, 15]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.seat('chair_gold', x, y - 0.85, 'front');
    r.seat('seatn_blue', x, y + 0.85, 'back');
  }
  r.add('desk_lamp', 5.4, 11.6, { rect: [1.4, 0.7] }).stamp(5.4, 12.4, 'Swipe your meal plan at the host stand', 1.2);
  r.add('vend_b', 17.3, 11.6, { rect: [1, 0.8], act: { kind: 'eat', item: 'soda', label: 'Fill a soda', text: 'Refill! 🥤' } });
  return r.done();
}
