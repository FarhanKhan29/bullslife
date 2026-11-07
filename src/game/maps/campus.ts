/**
 * The outdoor North Campus: a compact, stylised layout of real UB buildings.
 *   north row  — Center for the Arts, The Commons, Crossroads Culinary
 *   the Spine  — Baldy, Clemens, Capen, Norton, Talbert, Furnas, Bell
 *   centre     — Lockwood Library, Student Union, fountain plaza, Lake LaSalle
 *   east       — Davis, Ketter, Ellicott Complex
 *   south-west — Alumni Arena, UB Stadium, Governors, Greiner Hall
 * Every building is enterable (see buildings.ts + interiors*.ts).
 */
import { rng } from '../art';
import type { Collider } from '../iso';
import { BUILDINGS, doorTrigger } from './buildings';
import type { Ground, Interactable, MapDef, Prop, Trigger } from './types';

export const CAMPUS_W = 84;
export const CAMPUS_H = 70;

export const PLAZA = { x: 44.5, y: 29.5, r: 4.2 };
export const LAKE = { x: 52.5, y: 46.5, rx: 6.5, ry: 4.2 };
export const GARDEN = { x0: 41, y0: 55, x1: 53, y1: 70 };

/** Co-op activity layout (see activities/coop.ts). */
export const COOP = {
  plateA: { x: 58.6, y: 30 },
  plateB: { x: 68, y: 38.4 },
  plateRadius: 0.8,
  portal: { x: 56, y: 37.4 },
  gardenSpawn: { x: 47, y: 62 },
  gardenReturn: { x: 44, y: 58.6 },
  area: { x: 62, y: 34, r: 9 },
};

export const CAMPUS_SPAWN = { x: 44.5, y: 35.6 };

/** Walkways [x0, y0, x1, y1) in tiles. */
const PATHS: [number, number, number, number][] = [
  [2, 21, 82, 23], // the Academic Spine walkway
  [3, 10, 80, 11], // north road
  [26, 2, 28, 68], // west walk
  [50, 2, 52, 42], // centre walk (to the lake)
  [60, 23, 62, 61], // east walk
  [80, 23, 82, 33], // to Ketter
  // spurs to doors
  [6, 19, 8, 21],
  [15, 19, 18, 21],
  [33, 19, 35, 21],
  [45, 19, 47, 21],
  [55, 19, 58, 21],
  [65, 19, 68, 21],
  [75, 19, 77, 21],
  [7, 9, 9, 10],
  [44, 5, 50, 7],
  [59, 9, 61, 10],
  [23, 30, 26, 32],
  [35, 34, 37, 37],
  [28, 36, 46, 37],
  [44, 33, 46, 37],
  [60, 36, 66, 37],
  [15, 44, 26, 46],
  [19, 59, 26, 61],
  [28, 51, 40, 52],
  [39, 47, 41, 52],
  [28, 63, 37, 64],
  [35, 62, 37, 64],
  [60, 59, 72, 60],
];

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
      if (cx >= GARDEN.x0 && cx < GARDEN.x1 && cy >= GARDEN.y0 + 0.6) g = 'garden';
      for (const [x0, y0, x1, y1] of PATHS) if (cx >= x0 && cx < x1 && cy >= y0 && cy < y1) g = 'path';
      if (inEllipse(cx, cy, PLAZA.x, PLAZA.y, PLAZA.r, PLAZA.r)) g = 'plaza';
      if (inEllipse(cx, cy, LAKE.x, LAKE.y, LAKE.rx, LAKE.ry)) g = 'water';
      if (cx >= 48 && cx < 50 && cy >= 28.8 && cy < 30.8) g = 'booth';
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
    colliders.push(...(b.colliders ?? [{ kind: 'rect' as const, ...f }]));
    triggers.push({ id: 'door-' + b.id, ...doorTrigger(b), action: { type: 'goto', to: b.id } });
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
  props.push({ tex: 'flagpole', gx: 41, gy: 25.6, collider: { kind: 'circle', x: 41, y: 25.6, r: 0.2 } });
  props.push({ tex: 'sign_welcome', gx: 42.6, gy: 35.2, collider: { kind: 'circle', x: 42.6, y: 35.2, r: 0.25 } });
  props.push({ tex: 'mapboard', gx: 47.2, gy: 35, collider: { kind: 'circle', x: 47.2, y: 35, r: 0.4 } });
  interactables.push({ id: 'mapboard', gx: 47.2, gy: 35, radius: 1.6, prompt: 'Look at the campus map', action: { type: 'info', text: 'Every building on North Campus is open! Walk into any door, sit on chairs, try the food. Press M for the minimap and hold Shift to run.' } });
  props.push({ tex: 'sign_lake', gx: 51, gy: 41.4, collider: { kind: 'circle', x: 51, y: 41.4, r: 0.25 } });

  // ----- photo booth (east of the plaza)
  props.push({ tex: 'photobooth', gx: 50.6, gy: 28.6, collider: { kind: 'rect', x0: 49.9, y0: 28.1, x1: 51.3, y1: 29.1 } });
  interactables.push({ id: 'photo', gx: 49, gy: 29.8, radius: 1.3, prompt: 'Take a group photo', action: { type: 'photo' } });

  // ----- benches + lamps along walkways
  for (let x = 6; x < 80; x += 8) {
    props.push({ tex: 'lamp', gx: x, gy: 20.6, collider: { kind: 'circle', x, y: 20.6, r: 0.2 } });
    if (x % 16 === 6 && ground[23]?.[x] === 'grass')
      props.push({ tex: 'bench_x', gx: x + 2, gy: 23.6, collider: { kind: 'rect', x0: x + 1.2, y0: 23.35, x1: x + 2.8, y1: 23.85 }, act: { kind: 'sit', facing: 'back' }, reach: 1.1 });
  }
  for (let y = 4; y < 66; y += 8) props.push({ tex: 'lamp', gx: 25.6, gy: y, collider: { kind: 'circle', x: 25.6, y, r: 0.2 } });
  for (let y = 26; y < 60; y += 8) props.push({ tex: 'lamp', gx: 59.6, gy: y, collider: { kind: 'circle', x: 59.6, y, r: 0.2 } });
  for (const [x, y] of [
    [49.4, 39],
    [55.6, 40.6],
  ])
    props.push({ tex: 'bench_x', gx: x, gy: y, collider: { kind: 'rect', x0: x - 0.8, y0: y - 0.25, x1: x + 0.8, y1: y + 0.25 }, act: { kind: 'sit', facing: 'front' }, reach: 1.1 });
  props.push({ tex: 'trash', gx: 38.4, gy: 35.4, collider: { kind: 'circle', x: 38.4, y: 35.4, r: 0.25 } });
  props.push({ tex: 'bikerack', gx: 40, gy: 33.6, collider: { kind: 'rect', x0: 39.2, y0: 33.3, x1: 40.8, y1: 33.9 } });

  // ----- co-op activity (plates + portal) near Davis Hall
  props.push({ tex: 'sign_coop', gx: 58.2, gy: 33.6, collider: { kind: 'circle', x: 58.2, y: 33.6, r: 0.25 } });
  triggers.push({ id: 'portal', x0: COOP.portal.x - 0.6, y0: COOP.portal.y - 0.3, x1: COOP.portal.x + 0.6, y1: COOP.portal.y + 0.4, action: { type: 'teleport', x: COOP.gardenSpawn.x, y: COOP.gardenSpawn.y, requires: 'portal' } });
  colliders.push({ kind: 'circle', x: COOP.portal.x - 0.95, y: COOP.portal.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.portal.x + 0.95, y: COOP.portal.y - 0.1, r: 0.25 });

  // ----- secret garden (walled; only reachable through the co-op portal)
  colliders.push({ kind: 'rect', x0: GARDEN.x0, y0: GARDEN.y0 - 0.3, x1: GARDEN.x1, y1: GARDEN.y0 + 0.4 });
  colliders.push({ kind: 'rect', x0: GARDEN.x0 - 0.35, y0: GARDEN.y0, x1: GARDEN.x0 + 0.35, y1: GARDEN.y1 });
  colliders.push({ kind: 'rect', x0: GARDEN.x1 - 0.35, y0: GARDEN.y0, x1: GARDEN.x1 + 0.35, y1: GARDEN.y1 });
  for (let x = GARDEN.x0 + 0.5; x < GARDEN.x1; x += 1.1) props.push({ tex: 'hedge', gx: x, gy: GARDEN.y0 + 0.05 });
  for (let y = GARDEN.y0 + 1; y < GARDEN.y1; y += 1.1) {
    props.push({ tex: 'hedge', gx: GARDEN.x0, gy: y });
    props.push({ tex: 'hedge', gx: GARDEN.x1, gy: y });
  }
  props.push({ tex: 'statue', gx: 47, gy: 65, collider: { kind: 'rect', x0: 46.1, y0: 64.4, x1: 47.9, y1: 65.6 } });
  interactables.push({ id: 'statue', gx: 47, gy: 63.8, radius: 1.8, prompt: 'Admire the Golden Bull', action: { type: 'info', text: 'You found the Secret Garden! Only teams who work together get here.' } });
  props.push({ tex: 'portal_arch', gx: COOP.gardenReturn.x, gy: COOP.gardenReturn.y });
  triggers.push({ id: 'garden-return', x0: COOP.gardenReturn.x - 0.6, y0: COOP.gardenReturn.y - 0.3, x1: COOP.gardenReturn.x + 0.6, y1: COOP.gardenReturn.y + 0.4, action: { type: 'teleport', x: COOP.portal.x, y: COOP.portal.y + 1.4 } });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x - 0.95, y: COOP.gardenReturn.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x + 0.95, y: COOP.gardenReturn.y - 0.1, r: 0.25 });
  for (const [x, y] of [
    [43, 67],
    [51, 59],
    [51, 67],
    [43.5, 62],
  ])
    props.push({ tex: 'tree_cherry_' + (Math.floor(x + y) % 2), gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
  for (const [x, y] of [
    [45, 61],
    [49, 61],
    [45, 67.5],
    [49, 67.5],
  ])
    props.push({ tex: 'lantern', gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.15 } });

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
    if (x > GARDEN.x0 - 1 && x < GARDEN.x1 + 1 && y > GARDEN.y0 - 1) return true;
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

  // lake is not walkable (a row of circles approximates the ellipse)
  for (let i = -2; i <= 2; i++) colliders.push({ kind: 'circle', x: LAKE.x + i * 2.2, y: LAKE.y, r: Math.sqrt(1 - (i * 2.2) ** 2 / (LAKE.rx * LAKE.rx)) * LAKE.ry + 0.1 });

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
