/**
 * Interiors of the Academic Spine buildings + the Student Union.
 * Each one is a unique, hand-placed layout.
 */
import { Room } from './interiorKit';
import type { MapDef } from './types';

const BRICK = { wall: '#ece4d6', wallSide: '#e0d6c4', trim: '#7a4434', base: '#b98a5a' };

export const UNION_SEAL = { x: 8, y: 6.6, r: 2.3 };

/** Student Union — round atrium with the seal, balcony, info desk, café, lounge. */
export function unionInterior(): MapDef {
  const r = new Room('union', 16, 13, 'tile', {
    wall: '#f2efe8',
    wallSide: '#e4e0d7',
    trim: '#ffffff',
    wallHeight: 150,
    balcony: true,
    stairs: true,
    floorDecor: [{ kind: 'seal', ...UNION_SEAL }],
  });
  r.add('info_desk', 8, 2.2, { rect: [4, 1] }).stamp(8, 3.4, 'Check in at the Information Desk');
  r.add('cafe', 0.9, 8.4, { rect: [1.6, 4.2], act: { kind: 'eat', item: 'coffee', label: 'Order at Bulls Café', text: '☕ One large coffee and a sponge-candy cookie!' }, reach: 1.8 });
  r.add('vend_a', 0.6, 2.6, { rect: [1, 0.8], act: { kind: 'eat', item: 'chips', label: 'Buy a snack', text: 'Bzzzt… clunk! Buffalo-style chips. 🌶️' } });
  r.add('vend_b', 0.6, 3.7, { rect: [1, 0.8], act: { kind: 'eat', item: 'soda', label: 'Buy a drink', text: 'Clunk! An ice-cold soda. 🥤' } });
  for (const x of [4.3, 11.7]) r.add('column', x, 3.6, { r: 0.32 });
  // lounge
  r.seat('couch_x', 13, 1.5, 'front');
  r.map.colliders.push({ kind: 'rect', x0: 12, y0: 1.1, x1: 14, y1: 1.9 });
  r.add('coffee_table', 13, 3.4, { rect: [1, 0.8] });
  r.seat('armchair_gold', 12, 5.2, 'back');
  r.seat('armchair_blue', 14, 5.2, 'back');
  // study tables
  for (const y of [8.4, 10.6]) {
    r.add('study_table', 14, y, { rect: [2, 0.9] });
    r.seat('seatn_blue', 13.6, y + 0.85, 'back');
    r.seat('seatn_gold', 14.5, y + 0.85, 'back');
  }
  // café seating
  for (const [x, y] of [
    [3.2, 8],
    [3.4, 11],
  ]) {
    r.add('table_round', x, y, { r: 0.55 });
    r.seat('chair_gold', x, y - 0.85, 'front');
    r.seat('seatn_blue', x, y + 0.85, 'back');
  }
  for (const [x, y] of [
    [15.3, 0.6],
    [2.2, 0.6],
    [6.2, 11.9],
    [9.8, 11.9],
  ])
    r.add('plant', x, y, { r: 0.3 });
  r.info('seal', UNION_SEAL.x, UNION_SEAL.y, 'Look at the university seal', 'The University at Buffalo seal — founded 1846. Tradition says stepping on it before finals is bad luck. 😉', 1.1);
  return r.done();
}

/** Capen Hall — Silverman Library: stacks, carrels, reading tables, help desk. */
export function capenInterior(): MapDef {
  const r = new Room('capen', 18, 14, 'carpet', {
    ...BRICK,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 3, z: 40, h: 50, kind: 'window' },
      { wall: 'n', u: 5, w: 6, z: 64, h: 22, kind: 'sign', color: '#5a3b2a', text: ['SILVERMAN LIBRARY'] },
      { wall: 'n', u: 12, w: 3, z: 40, h: 50, kind: 'window' },
      { wall: 'w', u: 1, w: 4, z: 6, h: 56, kind: 'shelf' },
      { wall: 'w', u: 6, w: 3, z: 40, h: 30, kind: 'board' },
      { wall: 'w', u: 10, w: 2, z: 30, h: 40, kind: 'poster', color: '#005bbb', text: ['QUIET', 'PLEASE'] },
    ],
  });
  // help desk (stamp)
  r.add('info_desk', 14.5, 2.2, { rect: [4, 1] }).stamp(14.5, 3.4, 'Ask at the library Help Desk');
  // stacks
  for (const y of [3, 5.2]) for (const x of [2.4, 4.4, 6.4]) r.add('shelf_x', x, y, { rect: [1.8, 0.45], act: { kind: 'use', use: 'book', label: 'Browse the books' } });
  // carrels with computers
  for (const x of [2, 3.6, 5.2]) {
    r.add('desk_pc', x, 8, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Use the computer' } });
    r.seat('seatn_blue', x, 8.75, 'back');
  }
  // reading tables
  for (const [x, y] of [
    [10.5, 6],
    [10.5, 9.4],
  ]) {
    r.add('reading_table', x, y, { rect: [2.4, 1] });
    for (const dx of [-0.6, 0.6]) {
      r.seat('chair_gold', x + dx, y - 0.85, 'front');
      r.seat('seatn_gold', x + dx, y + 0.85, 'back');
    }
  }
  // lounge corner
  r.seat('beanbag_blue', 15, 7, 'front');
  r.seat('beanbag_orange', 16.2, 8.2, 'front');
  r.seat('couch_y', 14.8, 10.6, 'side');
  r.map.colliders.push({ kind: 'rect', x0: 14.4, y0: 9.6, x1: 15.2, y1: 11.6 });
  r.add('plant', 17.3, 0.7, { r: 0.3 });
  r.add('plant', 0.7, 12.5, { r: 0.3 });
  return r.done();
}

/** Lockwood Memorial Library — tall stacks, grand reading room, special collections. */
export function lockwoodInterior(): MapDef {
  const r = new Room('lockwood', 18, 15, 'darkwood', {
    wall: '#e8dfcc',
    wallSide: '#dccfb8',
    trim: '#3b2618',
    base: '#6b4428',
    wallHeight: 130,
    items: [
      { wall: 'n', u: 0.5, w: 7, z: 4, h: 80, kind: 'shelf' },
      { wall: 'n', u: 8.5, w: 2, z: 30, h: 80, kind: 'window' },
      { wall: 'n', u: 11, w: 6.5, z: 90, h: 22, kind: 'sign', color: '#3b2618', text: ['LOCKWOOD MEMORIAL LIBRARY'] },
      { wall: 'n', u: 11, w: 2.6, z: 20, h: 60, kind: 'window' },
      { wall: 'n', u: 14.4, w: 2.6, z: 20, h: 60, kind: 'window' },
      { wall: 'w', u: 0.5, w: 13.5, z: 4, h: 80, kind: 'shelf' },
    ],
  });
  // tall stacks (west half)
  for (const y of [3, 5.4, 7.8, 10.2]) for (const x of [2.6, 4.6]) r.add('shelf_tall_x', x, y, { rect: [1.8, 0.45], act: { kind: 'use', use: 'book', label: 'Pull a book from the stacks' } });
  // grand reading room (east)
  for (const [x, y] of [
    [11, 4],
    [11, 7.4],
    [15, 4],
    [15, 7.4],
  ]) {
    r.add('reading_table', x, y, { rect: [2.4, 1] });
    r.seat('chair_blue', x - 0.6, y - 0.85, 'front');
    r.seat('seatn_blue', x + 0.6, y + 0.85, 'back');
  }
  // special collections (stamp)
  r.add('display_case', 13, 10.8, { rect: [1.4, 0.7], act: { kind: 'use', use: 'info', label: 'Look at the rare books', text: '📜 Special Collections: UB holds one of the world’s largest poetry archives and James Joyce manuscripts.' } });
  r.stamp(13, 11.8, 'Sign the Special Collections guest book', 1.3);
  // computers near the entrance
  for (const x of [2.4, 4.4]) {
    r.add('desk_pc', x, 12.4, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Search the catalogue' } });
  }
  r.add('plant', 17.2, 13.8, { r: 0.3 });
  r.add('plant', 6.6, 13.8, { r: 0.3 });
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
  r.add('podium', 4, 1.8, { rect: [0.8, 0.6] });
  r.stamp(4, 2.8, 'Give a lecture at the podium', 1.2);
  r.board('norton-board', 11, 1.4);
  // rows of seats facing the stage (aisle in the middle)
  for (const y of [5, 6.6, 8.2, 9.8]) {
    for (let x = 1.5; x <= 6.5; x += 1) r.seat(y % 2 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
    for (let x = 9.5; x <= 14.5; x += 1) r.seat(y % 2 ? 'seatn_blue' : 'seatn_gold', x, y, 'back');
  }
  return r.done();
}

/** Talbert Hall — classroom with a shared whiteboard + tutoring corner. */
export function talbertInterior(): MapDef {
  const r = new Room('talbert', 15, 12, 'lino', {
    ...BRICK,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 0.6, w: 2.4, z: 40, h: 50, kind: 'window' },
      { wall: 'n', u: 11.5, w: 3, z: 40, h: 50, kind: 'window' },
      { wall: 'w', u: 1, w: 3, z: 30, h: 50, kind: 'chalk' },
      { wall: 'w', u: 6, w: 2, z: 40, h: 30, kind: 'poster', color: '#3fae6b', text: ['MATH', 'PLACE'] },
      { wall: 'w', u: 9, w: 1, z: 50, h: 18, kind: 'clock' },
    ],
  });
  r.board('talbert-board', 6, 1.2);
  r.add('desk_lamp', 9.4, 2.4, { rect: [1.4, 0.7] });
  r.stamp(9.4, 3.3, 'Sign in at the Tutoring Center', 1.2);
  for (const y of [4.6, 6.6, 8.6]) for (const x of [2.2, 4.2, 6.2]) {
    r.add('desk_books', x, y, { rect: [1.4, 0.7] });
    r.seat('seatn_blue', x, y + 0.7, 'back');
  }
  // tutoring corner
  r.add('table_round', 12, 7, { r: 0.55 });
  r.seat('chair_gold', 12, 6.15, 'front');
  r.seat('seatn_gold', 12, 7.85, 'back');
  r.add('shelf_y', 14.5, 7.4, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Grab a textbook' } });
  r.add('plant', 14.3, 11.3, { r: 0.3 });
  return r.done();
}

/** Baldy Hall — computer lab and offices. */
export function baldyInterior(): MapDef {
  const r = new Room('baldy', 15, 12, 'carpet', {
    ...BRICK,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 8, z: 60, h: 22, kind: 'sign', color: '#005bbb', text: ['COMPUTER LAB · OPEN 24/7'] },
      { wall: 'n', u: 10.5, w: 3.5, z: 30, h: 50, kind: 'window' },
      { wall: 'w', u: 2, w: 3, z: 40, h: 30, kind: 'board' },
      { wall: 'w', u: 7, w: 2.5, z: 30, h: 40, kind: 'poster', color: '#d94b4b', text: ['PRINT', 'HERE'] },
    ],
  });
  r.add('desk_lamp', 2.2, 1.8, { rect: [1.4, 0.7] }).stamp(2.2, 2.7, 'Log in at the lab help desk', 1.2);
  for (const y of [4, 6.4, 8.8]) for (const x of [1.8, 3.6, 5.4, 7.2]) {
    r.add('desk_pc', x, y, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Use the computer' } });
    r.seat('seatn_blue', x, y + 0.75, 'back');
  }
  // offices (east, behind partitions)
  r.partition(10, 0, 4.2, false).partition(10, 4.2, 5, true);
  r.add('desk_lamp', 12.4, 1.6, { rect: [1.4, 0.7] });
  r.seat('chair_blue', 12.4, 0.75, 'front');
  r.add('shelf_y', 14.5, 2.4, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Read a journal' } });
  r.seat('couch_x', 12.5, 7.4, 'front');
  r.map.colliders.push({ kind: 'rect', x0: 11.5, y0: 7, x1: 13.5, y1: 7.8 });
  r.add('vend_b', 14.4, 10.6, { rect: [1, 0.8], act: { kind: 'eat', item: 'soda', label: 'Buy a drink', text: 'Clunk! Energy for the all-nighter. 🥤' } });
  return r.done();
}

/** Clemens Hall — humanities: art gallery, seminar room, easel. */
export function clemensInterior(): MapDef {
  const r = new Room('clemens', 14, 12, 'wood', {
    wall: '#f4f1ea',
    wallSide: '#e9e5dc',
    trim: '#3b3f45',
    wallHeight: 130,
    items: [
      { wall: 'n', u: 1, w: 2.4, z: 40, h: 40, kind: 'art', color: '#f2a93b' },
      { wall: 'n', u: 4.2, w: 2, z: 46, h: 34, kind: 'art', color: '#3e7aa8' },
      { wall: 'n', u: 7, w: 3, z: 36, h: 48, kind: 'art', color: '#d94b4b' },
      { wall: 'n', u: 10.8, w: 2.4, z: 42, h: 40, kind: 'art', color: '#3fae6b' },
      { wall: 'n', u: 3, w: 8, z: 98, h: 20, kind: 'sign', color: '#3b3f45', text: ['HUMANITIES GALLERY'] },
      { wall: 'w', u: 1.5, w: 2.4, z: 40, h: 40, kind: 'art', color: '#7a5cd6' },
      { wall: 'w', u: 5, w: 2.8, z: 36, h: 46, kind: 'art', color: '#e8bd3a' },
      { wall: 'w', u: 9, w: 2, z: 44, h: 34, kind: 'art', color: '#ff8fb1' },
    ],
  });
  r.add('sculpture', 4, 4, { r: 0.4 });
  r.stamp(4, 5, 'Read the gallery placard', 1.2);
  r.add('sculpture', 9.5, 4, { r: 0.4, act: { kind: 'use', use: 'info', label: 'Admire the sculpture', text: '🗿 “Bull at Dawn” — a student sculpture in bronze.' } });
  r.add('easel', 12.4, 2.4, { r: 0.35, act: { kind: 'use', use: 'easel', label: 'Paint on the easel' } });
  // seminar table
  r.add('reading_table', 6.8, 8, { rect: [2.4, 1] });
  for (const dx of [-0.6, 0.6]) {
    r.seat('chair_gold', 6.8 + dx, 7.15, 'front');
    r.seat('seatn_gold', 6.8 + dx, 8.85, 'back');
  }
  r.add('shelf_y', 0.5, 9, { rect: [0.45, 1.8], act: { kind: 'use', use: 'book', label: 'Read some poetry' } });
  r.seat('armchair_blue', 12, 8.6, 'front');
  r.add('plant', 13.3, 11.3, { r: 0.3 });
  return r.done();
}
