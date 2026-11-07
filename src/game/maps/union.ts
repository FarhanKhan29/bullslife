/**
 * Student Union interior, modelled on the real round atrium:
 * grey tile floor with the university seal in the middle, white columns
 * holding a second-floor balcony with black railings, a navy information
 * desk (passport stamp), Bulls Café, vending, a "living room" lounge and
 * study tables, plus an open staircase (from the 2025 renovation).
 */
import type { Collider } from '../iso';
import { SU_DOOR_SPAWN } from './campus';
import type { Ground, MapDef, Prop } from './types';

export const UNION_SEAL = { x: 8, y: 6.6, r: 2.3 };

export function buildUnion(): MapDef {
  const W = 16;
  const H = 13;
  const ground: Ground[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Ground[] = [];
    for (let x = 0; x < W; x++) row.push(x >= 7 && x < 9 && y === H - 1 ? 'mat' : 'tile');
    ground.push(row);
  }

  const props: Prop[] = [];
  const colliders: Collider[] = [];
  const add = (tex: string, gx: number, gy: number, c?: Collider) => {
    props.push({ tex, gx, gy, collider: c });
    if (c) colliders.push(c);
  };

  // information desk (passport landmark) under the balcony
  add('info_desk', 8, 2.2, { kind: 'rect', x0: 6, y0: 1.7, x1: 10, y1: 2.7 });
  // Bulls Café along the west wall + vending
  add('cafe', 0.9, 8.4, { kind: 'rect', x0: 0, y0: 6.3, x1: 1.6, y1: 10.5 });
  add('vend_a', 0.6, 2.6, { kind: 'rect', x0: 0.1, y0: 2.2, x1: 1.1, y1: 3.0 });
  add('vend_b', 0.6, 3.7, { kind: 'rect', x0: 0.1, y0: 3.3, x1: 1.1, y1: 4.1 });
  // columns ringing the seal
  for (const [x, y] of [
    [4.3, 3.6],
    [11.7, 3.6],
  ]) {
    add('column', x, y, { kind: 'circle', x, y, r: 0.32 });
  }
  // lounge ("living room") on the east side
  add('couch_x', 13, 1.5, { kind: 'rect', x0: 12, y0: 1.1, x1: 14, y1: 1.9 });
  add('couch_y', 15, 4.2, { kind: 'rect', x0: 14.6, y0: 3.2, x1: 15.4, y1: 5.2 });
  add('coffee_table', 13.2, 3.6, { kind: 'rect', x0: 12.7, y0: 3.2, x1: 13.7, y1: 4.0 });
  add('armchair_gold', 12.2, 5.4, { kind: 'circle', x: 12.2, y: 5.4, r: 0.4 });
  add('armchair_blue', 13.8, 5.6, { kind: 'circle', x: 13.8, y: 5.6, r: 0.4 });
  // study tables
  for (const [x, y] of [
    [14, 8.4],
    [14, 10.6],
  ]) {
    add('study_table', x, y, { kind: 'rect', x0: x - 1, y0: y - 0.45, x1: x + 1, y1: y + 0.45 });
    add('chair_blue', x - 0.4, y + 0.9, { kind: 'circle', x: x - 0.4, y: y + 0.9, r: 0.22 });
    add('chair_gold', x + 0.5, y + 0.9, { kind: 'circle', x: x + 0.5, y: y + 0.9, r: 0.22 });
  }
  // cafe seating
  for (const [x, y] of [
    [3.2, 8],
    [3.4, 11],
  ]) {
    add('table_round', x, y, { kind: 'circle', x, y, r: 0.55 });
    add('chair_blue', x + 0.9, y, { kind: 'circle', x: x + 0.9, y, r: 0.22 });
    add('chair_gold', x, y - 0.9, { kind: 'circle', x, y: y - 0.9, r: 0.22 });
  }
  for (const [x, y] of [
    [15.3, 0.6],
    [2.2, 0.6],
    [6.2, 11.9],
    [9.8, 11.9],
  ]) {
    add('plant', x, y, { kind: 'circle', x, y, r: 0.3 });
  }

  return {
    id: 'union',
    name: 'Student Union',
    w: W,
    h: H,
    ground,
    props,
    colliders,
    interactables: [
      { id: 'stamp-union', gx: 8, gy: 3.4, radius: 1.6, prompt: 'Check in at the Information Desk', action: { type: 'stamp', stamp: 'union' } },
      { id: 'seal', gx: UNION_SEAL.x, gy: UNION_SEAL.y, radius: 1.2, prompt: 'Look at the university seal', action: { type: 'info', text: 'The University at Buffalo seal — founded 1846. Tradition says stepping on it before finals is bad luck. 😉' } },
      { id: 'cafe', gx: 2.2, gy: 8.4, radius: 1.3, prompt: 'Order at Bulls Café', action: { type: 'info', text: 'One large coffee and a sponge-candy cookie, coming up! ☕' } },
      { id: 'vending', gx: 1.6, gy: 3.3, radius: 1.2, prompt: 'Grab a snack', action: { type: 'info', text: 'Bzzzt… clunk! You got a bag of Buffalo-style chips. 🌶️' } },
      { id: 'lounge', gx: 13, gy: 4.6, radius: 1.4, prompt: 'Relax in the lounge', action: { type: 'info', text: 'The lounge is the best place to meet people. Say hi in chat!' } },
    ],
    triggers: [{ id: 'exit', x0: 7, y0: H - 0.5, x1: 9, y1: H, action: { type: 'goto', to: 'campus', spawn: SU_DOOR_SPAWN } }],
    spawn: { x: 8, y: 11.3 },
    wallHeight: 150,
  };
}
