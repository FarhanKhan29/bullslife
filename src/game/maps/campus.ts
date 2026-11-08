/**
 * UB North Campus, oriented north-up in grid coordinates. The Academic Spine
 * connects the west academic core to Student Union and the east arts district.
 * The north residences and southeast athletics grounds use compressed distances.
 */
import { rng } from '../art';
import type { Collider } from '../iso';
import { BUILDINGS, doorOutside, doorTrigger } from './buildings';
import type { Ground, Interactable, MapDef, Prop, Trigger } from './types';

export const CAMPUS_W = 130;
export const CAMPUS_H = 100;

export const PLAZA = { x: 82, y: 69, r: 3.7 };
export const LAKE = { x: 98, y: 39, rx: 18, ry: 12 };
export const GARDEN = { x0: 34, y0: 82, x1: 46, y1: 96 };

const PHOTO_BOOTH = { x: 87.5, y: 69 };
const MAP_BOARD = { x: 80, y: 74 };
const COOP_SIGN = { x: 69.2, y: 44 };

export const COOP = {
  plateA: { x: 66.6, y: 39 },
  plateB: { x: 72.5, y: 43.6 },
  plateRadius: 0.8,
  portal: { x: 69.7, y: 47.2 },
  gardenSpawn: { x: 40, y: 89 },
  gardenReturn: { x: 37, y: 85.5 },
  area: { x: 69.5, y: 43.6, r: 7 },
};

export const CAMPUS_SPAWN = { x: 76, y: 73 };

/** Walkways [x0, y0, x1, y1) in tiles. Grid x is east, y is south. */
const PATHS: [number, number, number, number][] = [
  [20, 73, 105, 75], // Academic Spine and Founders Promenade
  [27, 55, 80, 57], // Mary Talbert Way
  [17, 58, 27, 60], // Governors approach
  [25, 55, 27, 74],
  [71, 21, 73, 52], // Lee Road, from Ellicott to Student Union
  [71, 51, 77, 53],
  [75, 52, 77, 74],
  [68, 18, 77, 20], // Crossroads and Ellicott
  [72, 21, 88, 23], // north lake shore
  [72, 34, 81, 36], // Greiner entrance
  [85, 21, 87, 28],
  [74, 51, 88, 53], // Lee Loop and Commons
  [85, 53, 87, 55],
  [55, 41, 57, 57], // engineering walk
  [54, 44, 75, 46],
  [61, 53, 63, 57],
  [62, 63, 64, 73],
  [52, 69, 54, 74],
  [33, 74, 35, 77],
  [74, 68, 79, 75], // Student Union
  [85, 64, 87, 74], // Commons to Center for the Arts
  [92, 70, 95, 75],
  [58, 82, 98, 85], // south side of the academic core
  [61, 74, 63, 85],
  [77, 73, 79, 84],
  [82, 83, 84, 87],
  [96, 74, 98, 85],
  [110, 76, 113, 84], // Alumni Arena to stadium
  [111, 79, 128, 81],
  [126, 79, 128, 92],
  [59, 69, 61, 73], // Knox Lecture Hall
  [21, 75, 23, 91], // down to the Natural Sciences halls
  [15, 90, 30, 91],
  [15, 89, 17, 91], // Cooke Hall
  [27, 89, 29, 91], // Hochstetter Hall
];

/**
 * Roads, each three tiles wide: a ring around campus, Putnam Way through the
 * south side, and a short spur into every parking lot that is not already on a road.
 */
export const ROADS = [
  { x0: 3, y0: 3, x1: 130, y1: 6 }, // north
  { x0: 3, y0: 3, x1: 6, y1: 100 }, // west
  { x0: 127, y0: 3, x1: 130, y1: 100 }, // east
  { x0: 3, y0: 97, x1: 130, y1: 100 }, // south
  { x0: 47, y0: 86, x1: 96, y1: 89 }, // Putnam Way
  { x0: 60, y0: 89, x1: 63, y1: 97 },
  { x0: 93, y0: 89, x1: 96, y1: 97 },
  { x0: 6, y0: 65, x1: 8, y1: 68 }, // to Governors Lot
  { x0: 6, y0: 45, x1: 36, y1: 48 }, // to Jarvis Lot
  { x0: 94, y0: 6, x1: 97, y1: 8 }, // to Ellicott Lot
  { x0: 114, y0: 65, x1: 127, y1: 68 }, // to Center for the Arts Lot
];

/** UB Stampede routes (clockwise, keeping to the right-hand lane). */
export const BUS_ROUTES: { x: number; y: number; stop?: boolean }[][] = [
  [{ x: 5.1, y: 5.1 }, { x: 127.9, y: 5.1 }, { x: 127.9, y: 97.9 }, { x: 5.1, y: 97.9 }],
  [{ x: 62.1, y: 88.1 }, { x: 70, y: 88.1, stop: true }, { x: 93.9, y: 88.1 }, { x: 93.9, y: 98.2 }, { x: 62.1, y: 98.2 }],
];

export const BUS_STOPS = [
  { x: 70, y: 89.7 }, // Putnam Way, by Lockwood
  { x: 26, y: 44.3 }, // Jarvis Lot spur
  { x: 118, y: 64.3 }, // Center for the Arts spur
];

/** Parked Stampede buses waiting at the spur stops. */
export const PARKED_BUSES = [
  { x: 26, y: 46.5 },
  { x: 118, y: 66.5 },
];

/** Campus parking lots, roughly where the real ones sit. */
export const PARKING_LOTS = [
  { name: 'Jarvis Lot', x0: 36, y0: 42, x1: 46, y1: 52 },
  { name: 'Governors Lot', x0: 8, y0: 63, x1: 22, y1: 70 },
  { name: 'Cooke Lot', x0: 6, y0: 75, x1: 19, y1: 81 },
  { name: 'Alumni Lot', x0: 96, y0: 86, x1: 108, y1: 97 },
  { name: 'Center for the Arts Lot', x0: 102, y0: 62, x1: 114, y1: 71 },
  { name: 'Ellicott Lot', x0: 89, y0: 8, x1: 101, y1: 20 },
];

/** Centre line (grid y) of each row of two-tile-deep parking stalls in a lot. */
export function parkingRows(l: { y0: number; y1: number }): number[] {
  const rows = [l.y0 + 1, l.y1 - 1];
  for (let y = l.y0 + 6; y + 3 <= l.y1 - 3; y += 6) rows.push(y - 1, y + 1);
  return rows;
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

export function buildCampus(): MapDef {
  const W = CAMPUS_W;
  const H = CAMPUS_H;
  const ground: Ground[][] = [];
  for (let y = 0; y < H; y++) {
    const row: Ground[] = [];
    for (let x = 0; x < W; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      let g: Ground = 'grass';
      for (const l of PARKING_LOTS) if (cx >= l.x0 && cx < l.x1 && cy >= l.y0 && cy < l.y1) g = 'asphalt';
      if (cx >= GARDEN.x0 && cx < GARDEN.x1 && cy >= GARDEN.y0 + 0.6 && cy < GARDEN.y1) g = 'garden';
      for (const [x0, y0, x1, y1] of PATHS) if (cx >= x0 && cx < x1 && cy >= y0 && cy < y1) g = 'path';
      for (const r of ROADS) if (cx >= r.x0 && cx < r.x1 && cy >= r.y0 && cy < r.y1) g = g === 'path' ? 'crosswalk' : 'road';
      if (inEllipse(cx, cy, PLAZA.x, PLAZA.y, PLAZA.r, PLAZA.r)) g = 'plaza';
      if (inEllipse(cx, cy, LAKE.x, LAKE.y, LAKE.rx, LAKE.ry)) g = 'water';
      if (Math.abs(cx - PHOTO_BOOTH.x) < 1.3 && Math.abs(cy - PHOTO_BOOTH.y) < 1.3) g = 'booth';
      row.push(g);
    }
    ground.push(row);
  }

  const props: Prop[] = [];
  const colliders: Collider[] = [];
  const interactables: Interactable[] = [];
  const triggers: Trigger[] = [];

  // ----- buildings + doors
  for (const b of BUILDINGS) {
    const f = { x0: b.x0, y0: b.y0, x1: b.x0 + b.w, y1: b.y0 + b.d };
    props.push({ tex: 'b_' + b.id, gx: f.x0, gy: f.y0, footprint: f, label: b.name, labelHeight: b.labelH });
    if (b.colliders) {
      for (const c of b.colliders) {
        colliders.push(c.kind === 'circle'
          ? { ...c, x: c.x + b.x0, y: c.y + b.y0 }
          : { kind: 'rect', x0: c.x0 + b.x0, y0: c.y0 + b.y0, x1: c.x1 + b.x0, y1: c.y1 + b.y0 });
      }
    } else {
      colliders.push({ kind: 'rect', ...f });
    }
    triggers.push({ id: 'door-' + b.id, ...doorTrigger(b), action: { type: 'goto', to: b.id } });
    const outside = doorOutside(b);
    interactables.push({
      id: 'entrance-' + b.id, gx: outside.x, gy: outside.y, radius: 1.25,
      prompt: 'Enter ' + b.name, action: { type: 'enter', to: b.id },
    });
  }

  // ----- plaza: fountain, benches, flag, signs
  props.push({ tex: 'fountain', gx: PLAZA.x, gy: PLAZA.y, collider: { kind: 'circle', x: PLAZA.x, y: PLAZA.y, r: 1.9 } });
  for (const [x, y, along] of [
    [PLAZA.x - 3.3, PLAZA.y, false],
    [PLAZA.x + 3.3, PLAZA.y, false],
    [PLAZA.x, PLAZA.y - 3.3, true],
  ] as [number, number, boolean][]) {
    props.push({
      tex: along ? 'bench_x' : 'bench_y',
      gx: x,
      gy: y,
      collider: along ? { kind: 'rect', x0: x - 0.8, y0: y - 0.25, x1: x + 0.8, y1: y + 0.25 } : { kind: 'rect', x0: x - 0.25, y0: y - 0.8, x1: x + 0.25, y1: y + 0.8 },
      act: { kind: 'sit', facing: along ? 'front' : 'side', flip: !along && x > PLAZA.x },
      reach: 1.1,
    });
  }
  props.push({ tex: 'flagpole', gx: 84.8, gy: 65.5, collider: { kind: 'circle', x: 84.8, y: 65.5, r: 0.2 } });
  props.push({ tex: 'sign_welcome', gx: 77.6, gy: 72, collider: { kind: 'circle', x: 77.6, y: 72, r: 0.25 } });
  props.push({ tex: 'mapboard', gx: MAP_BOARD.x, gy: MAP_BOARD.y, collider: { kind: 'circle', ...MAP_BOARD, r: 0.4 } });
  interactables.push({ id: 'mapboard', gx: MAP_BOARD.x, gy: MAP_BOARD.y, radius: 1.6, prompt: 'Look at the campus map', action: { type: 'info', text: 'Press M for a north-up campus map. Ellicott and Greiner are north of the Academic Spine. Follow the promenade east to the Center for the Arts and Alumni Arena.' } });
  props.push({ tex: 'sign_lake', gx: 88, gy: 51, collider: { kind: 'circle', x: 88, y: 51, r: 0.25 } });

  props.push({ tex: 'photobooth', gx: PHOTO_BOOTH.x, gy: PHOTO_BOOTH.y, collider: { kind: 'rect', x0: 86.8, y0: 68.5, x1: 88.2, y1: 69.5 } });
  interactables.push({ id: 'photo', gx: PHOTO_BOOTH.x, gy: PHOTO_BOOTH.y + 1, radius: 1.3, prompt: 'Take a group photo', action: { type: 'photo' } });

  for (const [x, y] of [[23, 60], [36, 72.4], [45, 74.7], [56, 72.4], [67, 74.7], [78, 60], [74.4, 52], [77.6, 34], [96, 74.7], [103, 71.4], [114, 82]]) {
    props.push({ tex: 'lamp', gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.2 } });
  }
  for (const [x, y] of [[46, 72.5], [65, 74.6], [88, 52.6], [94, 53]]) {
    props.push({ tex: 'bench_x', gx: x, gy: y, collider: { kind: 'rect', x0: x - 0.8, y0: y - 0.25, x1: x + 0.8, y1: y + 0.25 }, act: { kind: 'sit', facing: 'front' }, reach: 1.1 });
  }
  props.push({ tex: 'trash', gx: 79, gy: 73, collider: { kind: 'circle', x: 79, y: 73, r: 0.25 } });
  props.push({ tex: 'bikerack', gx: 71, gy: 70.9, collider: { kind: 'rect', x0: 70.2, y0: 70.6, x1: 71.8, y1: 71.2 } });

  // ----- co-op activity near Davis Hall
  props.push({ tex: 'sign_coop', gx: COOP_SIGN.x, gy: COOP_SIGN.y, collider: { kind: 'circle', ...COOP_SIGN, r: 0.25 } });
  triggers.push({ id: 'portal', x0: COOP.portal.x - 0.6, y0: COOP.portal.y - 0.3, x1: COOP.portal.x + 0.6, y1: COOP.portal.y + 0.4, action: { type: 'teleport', x: COOP.gardenSpawn.x, y: COOP.gardenSpawn.y, requires: 'portal' } });
  colliders.push({ kind: 'circle', x: COOP.portal.x - 0.95, y: COOP.portal.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.portal.x + 0.95, y: COOP.portal.y - 0.1, r: 0.25 });

  // ----- secret garden (walled; only reachable through the co-op portal)
  colliders.push({ kind: 'rect', x0: GARDEN.x0, y0: GARDEN.y0 - 0.3, x1: GARDEN.x1, y1: GARDEN.y0 + 0.4 });
  colliders.push({ kind: 'rect', x0: GARDEN.x0 - 0.35, y0: GARDEN.y0, x1: GARDEN.x0 + 0.35, y1: GARDEN.y1 });
  colliders.push({ kind: 'rect', x0: GARDEN.x1 - 0.35, y0: GARDEN.y0, x1: GARDEN.x1 + 0.35, y1: GARDEN.y1 });
  colliders.push({ kind: 'rect', x0: GARDEN.x0, y0: GARDEN.y1 - 0.4, x1: GARDEN.x1, y1: GARDEN.y1 + 0.3 });
  for (let x = GARDEN.x0 + 0.5; x < GARDEN.x1; x += 1.1) {
    props.push({ tex: 'hedge', gx: x, gy: GARDEN.y0 + 0.05 });
    props.push({ tex: 'hedge', gx: x, gy: GARDEN.y1 - 0.05 });
  }
  for (let y = GARDEN.y0 + 1; y < GARDEN.y1; y += 1.1) {
    props.push({ tex: 'hedge', gx: GARDEN.x0, gy: y });
    props.push({ tex: 'hedge', gx: GARDEN.x1, gy: y });
  }
  props.push({ tex: 'statue', gx: 40, gy: 93, collider: { kind: 'rect', x0: 39.1, y0: 92.4, x1: 40.9, y1: 93.6 } });
  interactables.push({ id: 'statue', gx: 40, gy: 91.8, radius: 1.8, prompt: 'Admire the Golden Bull', action: { type: 'info', text: 'You found the Secret Garden! Only teams who work together get here.' } });
  props.push({ tex: 'portal_arch', gx: COOP.gardenReturn.x, gy: COOP.gardenReturn.y });
  triggers.push({ id: 'garden-return', x0: COOP.gardenReturn.x - 0.6, y0: COOP.gardenReturn.y - 0.3, x1: COOP.gardenReturn.x + 0.6, y1: COOP.gardenReturn.y + 0.4, action: { type: 'teleport', x: COOP.portal.x, y: COOP.portal.y + 1.4 } });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x - 0.95, y: COOP.gardenReturn.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x + 0.95, y: COOP.gardenReturn.y - 0.1, r: 0.25 });
  for (const [x, y] of [
    [36, 95],
    [44, 87],
    [44, 95],
    [36.5, 90],
  ])
    props.push({ tex: 'tree_cherry_' + (Math.floor(x + y) % 2), gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
  for (const [x, y] of [
    [38, 89],
    [42, 89],
    [38, 95.2],
    [42, 95.2],
  ])
    props.push({ tex: 'lantern', gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.15 } });

  // ----- parking lots: a "P" sign at each lot and parked cars in about half the stalls
  const parkRand = rng(716);
  PARKING_LOTS.forEach((l, i) => {
    props.push({ tex: 'sign_park_' + i, gx: l.x1 + 0.7, gy: l.y0 + 0.5, collider: { kind: 'circle', x: l.x1 + 0.7, y: l.y0 + 0.5, r: 0.25 } });
    for (const row of parkingRows(l)) {
      for (let x = l.x0 + 0.5; x < l.x1; x += 1) {
        if (parkRand() > 0.5 || ground[Math.floor(row)]?.[Math.floor(x)] !== 'asphalt') continue;
        props.push({ tex: 'car_' + Math.floor(parkRand() * 6), gx: x, gy: row, collider: { kind: 'rect', x0: x - 0.38, y0: row - 0.9, x1: x + 0.38, y1: row + 0.9 } });
      }
    }
  });

  // ----- bus stops + parked Stampede buses
  for (const s of BUS_STOPS) props.push({ tex: 'bus_stop', gx: s.x, gy: s.y, collider: { kind: 'rect', x0: s.x - 0.8, y0: s.y - 0.2, x1: s.x + 0.8, y1: s.y + 0.2 } });
  for (const b of PARKED_BUSES) props.push({ tex: 'bus_x_f', gx: b.x, gy: b.y, collider: { kind: 'rect', x0: b.x - 2.5, y0: b.y - 0.55, x1: b.x + 2.5, y1: b.y + 0.55 } });

  // ----- vegetation (deterministic scatter so everyone sees the same campus)
  const rand = rng(1846);
  const blocked = (x: number, y: number) => {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 1 || gy < 1 || gx >= W - 1 || gy >= H - 1) return true;
    if (ground[gy][gx] !== 'grass') return true;
    for (const b of BUILDINGS) if (x > b.x0 - 1.4 && x < b.x0 + b.w + 1.4 && y > b.y0 - 1.4 && y < b.y0 + b.d + 1.4) return true;
    if (Math.hypot(x - COOP.area.x, y - COOP.area.y) < COOP.area.r) return true;
    if (Math.hypot(x - CAMPUS_SPAWN.x, y - CAMPUS_SPAWN.y) < 4) return true;
    if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + 1.5) return true;
    if (x > GARDEN.x0 - 1 && x < GARDEN.x1 + 1 && y > GARDEN.y0 - 1 && y < GARDEN.y1 + 1) return true;
    if (Math.hypot(x - COOP.portal.x, y - COOP.portal.y) < 2.5) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = ground[gy + dy]?.[gx + dx];
      if (n && n !== 'grass') return true;
    }
    return props.some((p) => !p.footprint && Math.abs(p.gx - x) < 1.7 && Math.abs(p.gy - y) < 1.7 && Math.hypot(p.gx - x, p.gy - y) < 1.7);
  };
  const treeKinds = ['tree_orange_0', 'tree_red_0', 'tree_gold_0', 'tree_green_0', 'tree_green_1', 'tree_orange_1', 'pine_0', 'pine_1', 'tree_red_1', 'tree_green2_0'];
  let placed = 0;
  for (let i = 0; i < 9000 && placed < 260; i++) {
    const x = 1 + rand() * (W - 2);
    const y = 1 + rand() * (H - 2);
    if (blocked(x, y)) continue;
    const edge = Math.min(x, y, W - x, H - y);
    if (edge > 5 && rand() < 0.45) continue;
    props.push({ tex: treeKinds[Math.floor(rand() * treeKinds.length)], gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.32 } });
    placed++;
  }
  for (let i = 0, n = 0; i < 4000 && n < 90; i++) {
    const x = 1 + rand() * (W - 2);
    const y = 1 + rand() * (H - 2);
    if (blocked(x, y)) continue;
    props.push({ tex: 'bush_' + Math.floor(rand() * 3), gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
    n++;
  }

  // The lake spans one continuous run of water tiles per row.
  for (let y = 0; y < H; y++) {
    const x0 = ground[y].indexOf('water');
    if (x0 !== -1) colliders.push({ kind: 'rect', x0, y0: y, x1: ground[y].lastIndexOf('water') + 1, y1: y + 1 });
  }

  return {
    id: 'campus',
    name: 'UB North Campus',
    w: W,
    h: H,
    ground,
    props,
    colliders,
    interactables,
    triggers,
    spawn: CAMPUS_SPAWN,
  };
}
