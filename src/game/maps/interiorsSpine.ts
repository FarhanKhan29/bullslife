/**
 * Interiors of the Academic Spine buildings + the Student Union.
 * Each one is a unique, hand-placed layout.
 */
import { Room } from './interiorKit';
import type { MapDef } from './types';

const BRICK = { wall: '#ece4d6', wallSide: '#e0d6c4', trim: '#7a4434', base: '#b98a5a' };

export const UNION_SEAL = { x: 10, y: 7.6, r: 2.3 };

/** Student Union first floor: Welcome Center and food and retail wings. */
export function unionInterior(): MapDef {
  const r = new Room('union', 21, 15, 'tile', {
    wall: '#f2efe8',
    wallSide: '#e4e0d7',
    trim: '#ffffff',
    wallHeight: 150,
    balcony: true,
    stairs: true,
    floorDecor: [{ kind: 'seal', ...UNION_SEAL }],
  });
  r.wall({ wall: 'n', u: 7, w: 6, z: 105, h: 22, kind: 'sign', color: '#005bbb', text: ['STUDENT UNION · FLOOR 1'] });
  r.add('info_desk', 10, 2.2, { rect: [4, 1] }).stamp(10, 3.4, 'Check in at the Welcome Center');
  r.counter('tims', 3.1, 10.8, 'Order at Tim Hortons');
  r.add('station_cafe', 2.1, 8, { rect: [2.2, 0.9] });
  r.counter('unionMarket', 17, 6.4, 'Order at Union Marketplace & Eatery');
  r.add('station_grill', 16.5, 3.6, { rect: [2.2, 0.9] });
  r.counter('moes', 18, 10.5, 'Order at Moe’s');
  r.add('station_salad', 19.1, 8.5, { rect: [2.2, 0.9] });
  r.partition(5.4, 0, 4, false);
  r.add('store_shelf_a', 2.4, 2.8, { rect: [1.6, 0.5] });
  r.add('store_shelf_b', 2.4, 4.2, { rect: [1.6, 0.5] });
  r.counter('campusTees', 4, 5.7, 'Shop at Campus Tees');
  r.link(1.15, 13.6, 'Stairs to Floor 2', 'union-dining');
  r.link(12.8, 12.5, 'Walk to Lockwood Library', 'lockwood', { x: 3.9, y: 3.4 });
  r.link(9.8, 10.4, 'Academic Spine to 1Capen', 'capen');
  for (const [x, y] of [[6.7, 8.1], [6.7, 12], [14.1, 8.1], [16.4, 12.5]]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.chairsNS(x, y);
  }
  r.add('plant', 19.8, 1.5, { r: 0.3 });
  r.add('plant', 7.3, 13.8, { r: 0.3 });
  r.info('seal', UNION_SEAL.x, UNION_SEAL.y, 'Look at the university seal', 'The University at Buffalo seal — founded 1846. Tradition says stepping on it before finals is bad luck. 😉', 1.1);
  return r.done();
}

/** Capen ground floor: 1Capen services with links to Silverman and One World. */
export function capenInterior(): MapDef {
  const r = new Room('capen', 17, 12, 'tile', {
    wall: '#eeeae5', wallSide: '#dce5ed', trim: '#005bbb', wallHeight: 115,
    items: [
      { wall: 'n', u: 1, w: 7, z: 61, h: 24, kind: 'sign', color: '#005bbb', text: ['1CAPEN · UB CARD OFFICE'] },
      { wall: 'n', u: 10, w: 5, z: 33, h: 60, kind: 'window' },
    ],
  });
  r.map.name = 'Capen Hall · Ground Floor';
  r.counter('mealPlans', 5, 3.5, 'Buy a Meal Plan at the UB Card Office');
  r.add('desk_pc', 2.8, 3.5, { rect: [1.4, 0.7] });
  r.stamp(3.1, 5.2, 'Check in at the 1Capen UB Card Office', 1.15);
  r.link(12.7, 4, 'Elevator to Silverman Library · Floor 3', 'silverman');
  r.link(14, 8.8, 'Walk to One World Café', 'one-world');
  r.link(3, 8.8, 'Walk to Talbert Hall', 'talbert', { x: 7.5, y: 9.5 });
  r.link(11.7, 9.1, 'Academic Spine to Student Union', 'union', { x: 10, y: 12 });
  r.floor(0, 0, 8, 6, 'lino');
  for (const x of [3.5, 5.5, 7.5]) r.seat('chair_blue', x, 8.1, 'front');
  r.add('plant', 0.8, 1.2, { r: 0.3 });
  r.add('plant', 15.7, 10.5, { r: 0.3 });
  return r.done();
}

/** Silverman Floor 3: reading rooms west, central computers, café and services, study rooms east. */
export function silvermanInterior(): MapDef {
  const r = new Room('silverman', 24, 19, 'carpet', {
    wall: '#e5e3de', wallSide: '#d5dce0', trim: '#24508b', wallHeight: 115,
    items: [
      { wall: 'n', u: 7, w: 11, z: 80, h: 22, kind: 'sign', color: '#24508b', text: ['SILVERMAN LIBRARY · FLOOR 3'] },
      { wall: 'w', u: 2, w: 4, z: 42, h: 44, kind: 'window' },
      { wall: 'w', u: 10, w: 4, z: 42, h: 44, kind: 'window' },
    ],
  }).exitTo('Silverman Library · Floor 3', 'capen', { x: 11.1, y: 5.3 });
  r.partition(6, 0, 7, false).partition(6, 8.8, 6.2, false);
  r.floor(0, 0, 6, 15, 'wood');
  r.info('grand-reading', 3.2, 7.5, 'Grand Reading Room', 'Grand Reading Room and quiet study tables on the west side.');
  for (const y of [3.1, 5.4, 10.1, 12.6]) {
    r.add('reading_table', 3.1, y, { rect: [2.4, 1] });
    r.chairsNS(3.1, y);
  }
  for (const x of [8, 9.7, 11.4]) for (const y of [3.4, 5.4, 12.2, 14.2]) {
    r.add('desk_pc', x, y, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Use a library workstation' } });
    r.seat('seatn_blue', x, y + 0.75, 'back');
  }
  r.counter('whispers', 13.2, 3.6, 'Order at Whispers Café');
  r.add('info_desk', 16.3, 4.5, { rect: [4, 1], act: { kind: 'use', use: 'info', label: 'Library Services and UBIT Help Desk',
    text: 'Get research help, borrow equipment, or ask UBIT about your laptop.' }, reach: 1.7 });
  r.partition(18.5, 0.8, 5, false).partition(18.5, 10.8, 4.5, false);
  for (const y of [3.3, 7.8, 12.3, 16.2]) {
    r.add('study_table', 21.4, y, { rect: [2, 0.9] });
    r.chairsNS(21.4, y);
  }
  for (const x of [7, 15.4, 17.8]) {
    r.add('reading_table', x, 16.7, { rect: [2.4, 1] });
    r.chairsNS(x, 16.7);
  }
  return r.done();
}

/** Lockwood Floor 2: courtyard, front Services Desk, study areas and collection ranges. */
export function lockwoodInterior(): MapDef {
  const r = new Room('lockwood', 23, 17, 'carpet', {
    wall: '#eee8d9', wallSide: '#d9d8d1', trim: '#66523b', wallHeight: 116,
    items: [
      { wall: 'n', u: 7, w: 12, z: 80, h: 22, kind: 'sign', color: '#453b31', text: ['LOCKWOOD MEMORIAL LIBRARY · FLOOR 2'] },
      { wall: 'w', u: 5, w: 7, z: 34, h: 48, kind: 'window' },
    ],
  });
  r.map.name = 'Lockwood Library · Floor 2';
  r.floor(6, 5, 15, 11, 'garden');
  r.partition(6, 5, 9, true).partition(6, 11, 9, true);
  r.partition(6, 5, 6, false).partition(15, 5, 6, false);
  r.add('plant', 8, 7.4, { r: 0.3 });
  r.add('plant', 12.6, 8.8, { r: 0.3 });
  r.add('info_desk', 15.5, 13.2, { rect: [4, 1] }).stamp(15.5, 14.4, 'Check in at the Services Desk', 1.25);
  for (const x of [8, 11, 14, 17]) {
    r.add('shelf_y', x, 3.2, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Browse the periodicals' } });
  }
  for (const y of [2.5, 4.4, 6.3, 8.2]) {
    r.add('shelf_x', 21.3, y, { rect: [1.8, 0.45], act: { kind: 'use', use: 'book', label: 'Browse the library collections' } });
  }
  for (const [x, y] of [[17.2, 7.3], [19, 7.3], [17.2, 9.7], [19, 9.7]]) {
    r.add('desk_pc', x, y, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Use a library computer' } });
    r.seat('seatn_blue', x, y + 0.75, 'back');
  }
  r.link(2.2, 3.1, 'Walk to Student Union', 'union', { x: 11.5, y: 12.5 });
  r.link(4.6, 1.4, 'Walk to Clemens Hall', 'clemens');
  r.link(8, 15.4, 'Walk to Baldy Hall', 'baldy');
  r.info('courtyard', 10.4, 11.8, 'Look into the courtyard', 'The second-floor study areas look into the library courtyard.');
  return r.done();
}

/** Norton Hall — a big lecture hall with a stage, podium and rows of seats. */
export function nortonInterior(): MapDef {
  const r = new Room('norton', 16, 14, 'carpet', {
    ...BRICK,
    wallHeight: 130,
    floorDecor: [{ kind: 'stage', x0: 0, y0: 0, x1: 16, y1: 3.2 }],
    items: [
      { wall: 'n', u: 3, w: 10, z: 40, h: 70, kind: 'screen', text: ['CSE 115', 'Intro to Computer Science', 'Welcome, Bulls!'] },
      { wall: 'w', u: 4, w: 2, z: 30, h: 40, kind: 'door' },
      { wall: 'w', u: 8, w: 3, z: 40, h: 30, kind: 'board' },
    ],
  });
  r.map.name = 'Norton Hall · Woldman Theatre';
  r.wall({ wall: 'n', u: 4, w: 8, z: 108, h: 18, kind: 'sign', color: '#005bbb', text: ['WOLDMAN THEATRE'] });
  r.add('podium', 4, 1.8, { rect: [0.8, 0.6] });
  r.stamp(4, 2.8, 'Give a lecture at the podium', 1.2);
  r.board('norton-board', 11, 1.4);
  r.link(12.2, 12.1, 'Walk to One World Café', 'one-world');
  // rows of seats facing the stage (aisle in the middle)
  for (const y of [5, 6.6, 8.2, 9.8]) {
    for (let x = 1.5; x <= 6.5; x += 1) r.seat(y % 2 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
    for (let x = 9.5; x <= 14.5; x += 1) r.seat(y % 2 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
  }
  return r.done();
}

/** Talbert Hall — classroom and International Student Services. */
export function talbertInterior(): MapDef {
  const r = new Room('talbert', 15, 12, 'lino', {
    ...BRICK,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 0.6, w: 2.4, z: 40, h: 50, kind: 'window' },
      { wall: 'n', u: 11.5, w: 3, z: 40, h: 50, kind: 'window' },
      { wall: 'w', u: 1, w: 3, z: 30, h: 50, kind: 'chalk' },
      { wall: 'w', u: 6, w: 2, z: 40, h: 30, kind: 'poster', color: '#3fae6b', text: ['TALBERT', 'ROOM 103'] },
      { wall: 'w', u: 9, w: 1, z: 50, h: 18, kind: 'clock' },
    ],
  });
  r.board('talbert-board', 6, 1.2);
  r.add('desk_lamp', 9.4, 2.4, { rect: [1.4, 0.7] });
  r.stamp(9.4, 3.3, 'Visit the International Student Services desk', 1.2);
  r.wall({ wall: 'n', u: 7.4, w: 7, z: 75, h: 20, kind: 'sign', color: '#005bbb', text: ['INTERNATIONAL STUDENT SERVICES'] });
  r.link(12.5, 10, 'Walk to Capen Hall', 'capen', { x: 4.7, y: 9.1 });
  for (const y of [4.6, 6.6, 8.6]) for (const x of [2.2, 4.2, 6.2]) {
    r.add('desk_books', x, y, { rect: [1.4, 0.7] });
    r.seat('seatn_blue', x, y + 0.7, 'back');
  }
  // Student services waiting area
  r.add('table_round', 12, 7, { r: 0.55 });
  r.seat('chair_gold', 12, 6.15, 'front');
  r.seat('seatn_gold', 12, 7.85, 'back');
  r.add('shelf_y', 14.5, 7.4, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Grab a textbook' } });
  r.add('plant', 14.3, 11.3, { r: 0.3 });
  return r.done();
}

/** Baldy Hall: classrooms and offices off the study corridor. */
export function baldyInterior(): MapDef {
  const r = new Room('baldy', 15, 12, 'carpet', {
    ...BRICK,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 8, z: 60, h: 22, kind: 'sign', color: '#005bbb', text: ['BALDY · STUDY CORRIDOR'] },
      { wall: 'n', u: 10.5, w: 3.5, z: 30, h: 50, kind: 'window' },
      { wall: 'w', u: 2, w: 3, z: 40, h: 30, kind: 'board' },
      { wall: 'w', u: 7, w: 2.5, z: 30, h: 40, kind: 'poster', color: '#d94b4b', text: ['PRINT', 'HERE'] },
    ],
  });
  r.add('podium', 3.3, 1.8, { rect: [0.8, 0.6] }).stamp(3.3, 2.8, 'Check in at the classroom podium', 1.2);
  r.link(12.5, 9.7, 'Walk to Lockwood Library', 'lockwood', { x: 9.5, y: 15.2 });
  for (const y of [4, 6.4, 8.8]) for (const x of [1.8, 3.6, 5.4, 7.2]) {
    r.add('desk_books', x, y, { rect: [1.4, 0.7] });
    r.seat('seatn_blue', x, y + 0.75, 'back');
  }
  // offices (east, behind partitions)
  r.partition(10, 0, 4.2, false).partition(10, 4.2, 5, true);
  r.add('desk_lamp', 12.4, 1.6, { rect: [1.4, 0.7] });
  r.seat('chair_blue', 12.4, 0.75, 'front');
  r.add('shelf_y', 14.5, 2.4, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Read a journal' } });
  r.seat('couch_x', 12.5, 7.4, 'front');
  r.map.colliders.push({ kind: 'rect', x0: 11.5, y0: 7, x1: 13.5, y1: 7.8 });
  r.add('vend_b', 14.4, 10.6, { rect: [1, 0.8], act: { kind: 'checkout', shop: 'drinks', label: 'Buy a drink' } });
  return r.done();
}

/** Clemens Hall: humanities classroom and language-learning workstations. */
export function clemensInterior(): MapDef {
  const r = new Room('clemens', 16, 12, 'lino', {
    ...BRICK, wallHeight: 122,
    items: [
      { wall: 'n', u: 2, w: 9, z: 82, h: 23, kind: 'sign', color: '#3b3f45', text: ['CLEMENS HALL · HUMANITIES'] },
      { wall: 'n', u: 2.1, w: 6, z: 28, h: 42, kind: 'chalk' },
      { wall: 'w', u: 4, w: 5, z: 33, h: 55, kind: 'window' },
    ],
  });
  r.partition(9.2, 0, 6, false);
  r.add('podium', 4.2, 2.3, { rect: [0.8, 0.6] });
  r.stamp(4.2, 3.4, 'Visit the humanities seminar room', 1.2);
  for (const y of [5.4, 7.8]) for (const x of [2.3, 5.7]) {
    r.add('reading_table', x, y, { rect: [2.4, 1] });
    r.chairsNS(x, y);
  }
  for (const x of [11, 13.6]) for (const y of [3.1, 5.6]) {
    r.add('desk_pc', x, y, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Use a language lab workstation' } });
    r.seat('seatn_blue', x, y + 0.75, 'back');
  }
  r.link(12.8, 9.7, 'Walk to Lockwood Library', 'lockwood', { x: 4.6, y: 3 });
  return r.done();
}

/** Knox Lecture Hall: one of the big tiered halls off the entrance atrium. */
export function knoxInterior(): MapDef {
  const r = new Room('knox', 18, 15, 'carpet', {
    wall: '#ece4d6', wallSide: '#e0d6c4', trim: '#7a4434', base: '#b98a5a',
    wallHeight: 135,
    floorDecor: [{ kind: 'stage', x0: 0, y0: 0, x1: 18, y1: 3.2 }],
    items: [
      { wall: 'n', u: 2, w: 14, z: 42, h: 74, kind: 'screen', text: ['KNOX 110', 'Welcome to lecture, Bulls!'] },
      { wall: 'w', u: 4.5, w: 2, z: 30, h: 44, kind: 'door' },
      { wall: 'w', u: 9, w: 3, z: 40, h: 34, kind: 'board' },
    ],
  });
  r.add('podium', 4.5, 1.8, { rect: [0.8, 0.6] });
  r.stamp(4.5, 2.8, 'Take the stage at the podium', 1.2);
  r.board('knox-board', 12.5, 1.4);
  for (const y of [5, 6.5, 8, 9.5, 11]) {
    for (let x = 1.5; x <= 7.5; x += 1) r.seat(y === 5 || y === 8 || y === 11 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
    for (let x = 10.5; x <= 16.5; x += 1) r.seat(y === 5 || y === 8 || y === 11 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
  }
  return r.done();
}

/** Cooke Hall: Natural Sciences teaching labs. */
export function cookeInterior(): MapDef {
  const r = new Room('cooke', 16, 12, 'lino', {
    wall: '#eef1f3', wallSide: '#dfe4e8', trim: '#5e7f6b', base: '#9aa3ad',
    wallHeight: 125,
    items: [
      { wall: 'n', u: 1, w: 8, z: 86, h: 22, kind: 'sign', color: '#5e7f6b', text: ['NATURAL SCIENCES TEACHING LABS'] },
      { wall: 'n', u: 10, w: 4.5, z: 30, h: 56, kind: 'window' },
      { wall: 'w', u: 1, w: 4, z: 34, h: 46, kind: 'chalk' },
      { wall: 'w', u: 7, w: 3, z: 40, h: 34, kind: 'poster', color: '#d94b4b', text: ['GOGGLES', 'ON!'] },
    ],
  });
  r.add('desk_lamp', 2.4, 1.8, { rect: [1.4, 0.7] }).stamp(2.4, 2.8, 'Sign in at the teaching lab', 1.2);
  for (const [x, y] of [[6, 3.6], [11, 3.6], [6, 7], [11, 7]]) {
    r.add('lab_chem', x, y, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Run an experiment', text: '🧪 The solution turned bright blue. Experiment complete!' } });
    r.seat('stool_blue', x - 0.5, y + 0.75, 'back');
    r.seat('stool_blue', x + 0.5, y + 0.75, 'back');
  }
  r.board('cooke-board', 3, 7.4);
  r.add('plant', 15.2, 11.2, { r: 0.3 });
  return r.done();
}

/** Hochstetter Hall: biology labs and a small classroom. */
export function hochstetterInterior(): MapDef {
  const r = new Room('hochstetter', 16, 12, 'lino', {
    wall: '#eef1f3', wallSide: '#dfe4e8', trim: '#3fae6b', base: '#9aa3ad',
    wallHeight: 125,
    items: [
      { wall: 'n', u: 1, w: 7, z: 86, h: 22, kind: 'sign', color: '#2f7d5b', text: ['BIOLOGICAL SCIENCES'] },
      { wall: 'n', u: 9.5, w: 5, z: 30, h: 56, kind: 'window' },
      { wall: 'w', u: 2, w: 3, z: 40, h: 36, kind: 'poster', color: '#3fae6b', text: ['CELL', 'BIOLOGY'] },
      { wall: 'w', u: 7, w: 3, z: 40, h: 34, kind: 'board' },
    ],
  });
  for (const [x, y] of [[3.4, 3.4], [8, 3.4], [3.4, 6.6], [8, 6.6]]) {
    r.add('lab_micro', x, y, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Use the microscope' } });
    r.seat('stool_red', x, y + 0.75, 'back');
  }
  r.stamp(3.4, 2.5, 'Look through the biology lab microscope', 1.1);
  r.add('shelf_y', 15.4, 4, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Read a field guide' } });
  r.add('plant', 12.6, 2, { r: 0.3 });
  r.add('plant', 14, 9.6, { r: 0.3 });
  r.board('hochstetter-board', 12.4, 6.4);
  return r.done();
}
