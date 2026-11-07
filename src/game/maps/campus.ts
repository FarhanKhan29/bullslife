/**
 * The outdoor campus: a compact, stylised take on UB North Campus.
 *   - Student Union (north-west, enterable)
 *   - Capen Hall (north-east)
 *   - Davis Hall (south-east) with the co-op switches
 *   - Central courtyard with fountain, Lake LaSalle on the east edge
 *   - A hidden "Secret Garden" (south-west) reachable only through the co-op portal
 */
import { rng } from '../art';
import type { Collider } from '../iso';
import type { Ground, Interactable, MapDef, Prop, Trigger } from './types';

export const CAMPUS_W = 46;
export const CAMPUS_H = 42;

export const SU = { x0: 6, y0: 5, x1: 15, y1: 12 };
export const CAPEN = { x0: 29, y0: 4, x1: 39, y1: 11 };
export const DAVIS = { x0: 29, y0: 27, x1: 38, y1: 35 };
export const COURTYARD = { x: 23, y: 21, r: 5.5 };
export const LAKE = { x: 42.2, y: 21, rx: 3.2, ry: 6.8 };
export const GARDEN = { x0: 0, y0: 31, x1: 12.5, y1: 42 };

/** Co-op activity layout (see activities/coop.ts). */
export const COOP = {
  plateA: { x: 26.5, y: 30.5 },
  plateB: { x: 34, y: 38.2 },
  plateRadius: 0.8,
  portal: { x: 26.5, y: 38.5 },
  gardenSpawn: { x: 6.5, y: 36.5 },
  gardenReturn: { x: 4, y: 34 },
};

export const SU_DOOR_SPAWN = { x: 11.6, y: 13.2 };

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function inRect(x: number, y: number, r: { x0: number; y0: number; x1: number; y1: number }) {
  return x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;
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
      if (inRect(cx, cy, GARDEN)) g = 'garden';
      // main spines
      if (cy >= 20 && cy < 22 && cx >= 3 && cx < 39) g = 'path';
      if (cx >= 22 && cx < 24 && cy >= 2 && cy < 30.5) g = 'path';
      // building approaches
      if (cx >= 11 && cx < 13 && cy >= 12 && cy < 20) g = 'path';
      if (cx >= 33 && cx < 35 && cy >= 11 && cy < 20) g = 'path';
      if (cx >= 33 && cx < 35 && cy >= 22 && cy < 27) g = 'path';
      // path around Davis to the co-op area
      if (cy >= 36 && cy < 37.5 && cx >= 24 && cx < 38) g = 'path';
      if (cx >= 24 && cx < 25.5 && cy >= 22 && cy < 37.5) g = 'path';
      if (inEllipse(cx, cy, COURTYARD.x, COURTYARD.y, COURTYARD.r, COURTYARD.r)) g = 'plaza';
      if (inEllipse(cx, cy, LAKE.x, LAKE.y, LAKE.rx, LAKE.ry)) g = 'water';
      // photo booth floor marking
      if (cx >= 29 && cx < 31 && cy >= 22.2 && cy < 24.2) g = 'booth';
      row.push(g);
    }
    ground.push(row);
  }

  const props: Prop[] = [];
  const colliders: Collider[] = [];
  const interactables: Interactable[] = [];
  const triggers: Trigger[] = [];

  // ----- buildings -----
  const building = (tex: string, f: typeof SU, label: string, labelHeight: number, shape?: Collider[]) => {
    props.push({ tex, gx: f.x0, gy: f.y0, footprint: f, label, labelHeight });
    if (shape) colliders.push(...shape);
    else colliders.push({ kind: 'rect', ...f });
  };
  // the Student Union is a round rotunda + back block, so its collider follows that shape
  building('b_union', SU, 'Student Union', 175, [
    { kind: 'rect', x0: 6, y0: 5, x1: 12.6, y1: 10.2 },
    { kind: 'rect', x0: 6, y0: 9.6, x1: 8.8, y1: 12 },
    { kind: 'rect', x0: 12.6, y0: 5.2, x1: 15, y1: 6.8 },
    { kind: 'circle', x: 11.6, y: 8.8, r: 3.2 },
  ]);
  building('b_capen', CAPEN, 'Capen Hall', 170);
  building('b_davis', DAVIS, 'Davis Hall', 160);

  // Student Union door → interior
  triggers.push({ id: 'su-door', x0: 10.8, y0: 11.7, x1: 12.4, y1: 12.45, action: { type: 'goto', to: 'union', spawn: { x: 8, y: 11.3 } } });
  interactables.push({ id: 'su-door-hint', gx: 11.6, gy: 12.9, radius: 1.4, prompt: 'Walk in to enter the Student Union', action: { type: 'info', text: 'Walk through the doors to go inside.' } });
  interactables.push({ id: 'capen-door', gx: 34, gy: 11.6, radius: 1.3, prompt: 'Capen Hall library — opening soon', action: { type: 'info', text: 'Capen Hall interior is coming in a future update. Collect the stamp at the plaque!' } });
  interactables.push({ id: 'davis-door', gx: 33.4, gy: 35.6, radius: 1.3, prompt: 'Davis Hall labs — opening soon', action: { type: 'info', text: 'Davis Hall interior is coming soon. Try the co-op switches nearby!' } });

  // ----- passport landmarks -----
  props.push({ tex: 'plaque', gx: 30.6, gy: 12.4, collider: { kind: 'circle', x: 30.6, y: 12.4, r: 0.35 } });
  interactables.push({ id: 'stamp-capen', gx: 30.6, gy: 12.4, radius: 1.5, prompt: 'Read the Capen Hall plaque', action: { type: 'stamp', stamp: 'capen' } });
  props.push({ tex: 'plaque', gx: 31, gy: 36.2, collider: { kind: 'circle', x: 31, y: 36.2, r: 0.35 } });
  interactables.push({ id: 'stamp-davis', gx: 31, gy: 36.2, radius: 1.5, prompt: 'Read the Davis Hall plaque', action: { type: 'stamp', stamp: 'davis' } });

  // ----- courtyard -----
  props.push({ tex: 'fountain', gx: COURTYARD.x, gy: COURTYARD.y, collider: { kind: 'circle', x: COURTYARD.x, y: COURTYARD.y, r: 1.9 } });
  props.push({ tex: 'flagpole', gx: 19.2, gy: 17.6, collider: { kind: 'circle', x: 19.2, y: 17.6, r: 0.2 } });
  props.push({ tex: 'sign_welcome', gx: 21.2, gy: 27.4, collider: { kind: 'circle', x: 21.2, y: 27.4, r: 0.25 } });
  props.push({ tex: 'mapboard', gx: 25, gy: 27.2, collider: { kind: 'circle', x: 25, y: 27.2, r: 0.4 } });
  interactables.push({ id: 'mapboard', gx: 25, gy: 27.2, radius: 1.6, prompt: 'Look at the campus map', action: { type: 'info', text: 'Student Union is north-west, Capen Hall north-east, Davis Hall south-east. Collect all 3 passport stamps!' } });
  for (const [x, y, along] of [
    [19.4, 21, false],
    [26.6, 21, false],
    [23, 17.4, true],
    [23, 24.6, true],
  ] as [number, number, boolean][]) {
    props.push({ tex: along ? 'bench_x' : 'bench_y', gx: x, gy: y, collider: along ? { kind: 'rect', x0: x - 0.8, y0: y - 0.25, x1: x + 0.8, y1: y + 0.25 } : { kind: 'rect', x0: x - 0.25, y0: y - 0.8, x1: x + 0.25, y1: y + 0.8 } });
  }
  // lamps along the spines
  for (const x of [6, 14, 30, 37]) props.push({ tex: 'lamp', gx: x, gy: 19.6, collider: { kind: 'circle', x, y: 19.6, r: 0.2 } });
  for (const y of [5, 12, 29]) props.push({ tex: 'lamp', gx: 21.6, gy: y, collider: { kind: 'circle', x: 21.6, y, r: 0.2 } });
  props.push({ tex: 'trash', gx: 27.6, gy: 19.5, collider: { kind: 'circle', x: 27.6, y: 19.5, r: 0.25 } });
  props.push({ tex: 'trash', gx: 13.6, gy: 13.3, collider: { kind: 'circle', x: 13.6, y: 13.3, r: 0.25 } });
  props.push({ tex: 'bikerack', gx: 15, gy: 14.2, collider: { kind: 'rect', x0: 14.2, y0: 13.9, x1: 15.8, y1: 14.5 } });
  props.push({ tex: 'sign_su', gx: 8.6, gy: 13.6, collider: { kind: 'circle', x: 8.6, y: 13.6, r: 0.25 } });
  props.push({ tex: 'sign_capen', gx: 32.4, gy: 12.6, collider: { kind: 'circle', x: 32.4, y: 12.6, r: 0.25 } });
  props.push({ tex: 'sign_davis', gx: 35.8, gy: 36.4, collider: { kind: 'circle', x: 35.8, y: 36.4, r: 0.25 } });
  props.push({ tex: 'sign_lake', gx: 37.4, gy: 15, collider: { kind: 'circle', x: 37.4, y: 15, r: 0.25 } });
  for (const [x, y] of [
    [38.8, 18.5],
    [38.8, 23.5],
  ]) {
    props.push({ tex: 'bench_y', gx: x, gy: y, collider: { kind: 'rect', x0: x - 0.25, y0: y - 0.8, x1: x + 0.25, y1: y + 0.8 } });
  }

  // ----- photo booth -----
  props.push({ tex: 'photobooth', gx: 31.6, gy: 22.6, collider: { kind: 'rect', x0: 30.9, y0: 22.1, x1: 32.3, y1: 23.1 } });
  interactables.push({ id: 'photo', gx: 30, gy: 23.2, radius: 1.3, prompt: 'Take a group photo', action: { type: 'photo' } });

  // ----- co-op activity (plates + portal) -----
  props.push({ tex: 'sign_coop', gx: 27.8, gy: 32.4, collider: { kind: 'circle', x: 27.8, y: 32.4, r: 0.25 } });
  triggers.push({ id: 'portal', x0: COOP.portal.x - 0.6, y0: COOP.portal.y - 0.3, x1: COOP.portal.x + 0.6, y1: COOP.portal.y + 0.4, action: { type: 'teleport', x: COOP.gardenSpawn.x, y: COOP.gardenSpawn.y, requires: 'portal' } });
  colliders.push({ kind: 'circle', x: COOP.portal.x - 0.95, y: COOP.portal.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.portal.x + 0.95, y: COOP.portal.y - 0.1, r: 0.25 });

  // ----- secret garden (walled by hedges; only reachable by portal) -----
  colliders.push({ kind: 'rect', x0: 0, y0: 30.3, x1: 13.2, y1: 31 });
  colliders.push({ kind: 'rect', x0: 12.5, y0: 30.3, x1: 13.2, y1: 42 });
  for (let x = 0.5; x < 13; x += 1.1) props.push({ tex: 'hedge', gx: x, gy: 30.65 });
  for (let y = 31.6; y < 42; y += 1.1) props.push({ tex: 'hedge', gx: 12.85, gy: y });
  props.push({ tex: 'statue', gx: 6.5, gy: 38.5, collider: { kind: 'rect', x0: 5.6, y0: 37.9, x1: 7.4, y1: 39.1 } });
  interactables.push({ id: 'statue', gx: 6.5, gy: 37.4, radius: 1.8, prompt: 'Admire the Golden Bull', action: { type: 'info', text: 'You found the Secret Garden! Only teams who work together get here.' } });
  props.push({ tex: 'portal_arch', gx: COOP.gardenReturn.x, gy: COOP.gardenReturn.y });
  triggers.push({ id: 'garden-return', x0: COOP.gardenReturn.x - 0.6, y0: COOP.gardenReturn.y - 0.3, x1: COOP.gardenReturn.x + 0.6, y1: COOP.gardenReturn.y + 0.4, action: { type: 'teleport', x: COOP.portal.x, y: COOP.portal.y + 1.4 } });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x - 0.95, y: COOP.gardenReturn.y + 0.1, r: 0.25 });
  colliders.push({ kind: 'circle', x: COOP.gardenReturn.x + 0.95, y: COOP.gardenReturn.y - 0.1, r: 0.25 });
  for (const [x, y] of [
    [2.5, 39.5],
    [10.5, 33.5],
    [10, 40],
    [2, 32.5],
  ]) {
    props.push({ tex: 'tree_cherry_' + Math.floor(x + y) % 2, gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
  }
  for (const [x, y] of [
    [4.5, 36],
    [8.6, 36],
    [4.5, 40.5],
    [8.6, 40.5],
  ]) {
    props.push({ tex: 'lantern', gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.15 } });
  }

  // ----- vegetation (deterministic scatter) -----
  const rand = rng(1846); // UB founding year
  const occupied = (x: number, y: number) => {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gy < 0 || gx >= W || gy >= H) return true;
    const g = ground[gy][gx];
    if (g !== 'grass') return true;
    const pad = 1.6;
    for (const f of [SU, CAPEN, DAVIS]) {
      if (x > f.x0 - pad && x < f.x1 + pad && y > f.y0 - pad && y < f.y1 + pad) return true;
    }
    if (x > 25 && x < 37 && y > 28 && y < 40) return true; // co-op area stays open
    if (x > 18 && x < 28 && y > 24 && y < 30) return true; // spawn plaza
    // near paths keep 1 tile of clearance
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && ground[ny][nx] !== 'grass' && ground[ny][nx] !== 'garden') return true;
    }
    return props.some((p) => !p.footprint && Math.hypot(p.gx - x, p.gy - y) < 1.8);
  };
  const treeKinds = ['tree_orange_0', 'tree_red_0', 'tree_gold_0', 'tree_green_0', 'tree_green_1', 'tree_orange_1', 'pine_0', 'pine_1', 'tree_red_1', 'tree_green2_0'];
  let placed = 0;
  for (let i = 0; i < 2000 && placed < 120; i++) {
    const x = 0.8 + rand() * (W - 1.6);
    const y = 0.8 + rand() * (H - 1.6);
    if (occupied(x, y)) continue;
    // denser near the edges for a framed look
    const edge = Math.min(x, y, W - x, H - y);
    if (edge > 5 && rand() < 0.55) continue;
    const kind = treeKinds[Math.floor(rand() * treeKinds.length)];
    props.push({ tex: kind, gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.32 } });
    placed++;
  }
  for (let i = 0, b = 0; i < 1500 && b < 45; i++) {
    const x = 1 + rand() * (W - 2);
    const y = 1 + rand() * (H - 2);
    if (occupied(x, y)) continue;
    props.push({ tex: 'bush_' + Math.floor(rand() * 3), gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
    b++;
  }
  // flower bushes ringing the courtyard
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    const x = COURTYARD.x + Math.cos(a) * 6.6;
    const y = COURTYARD.y + Math.sin(a) * 6.6;
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (ground[gy]?.[gx] !== 'grass') continue;
    props.push({ tex: 'bush_' + (i % 3), gx: x, gy: y, collider: { kind: 'circle', x, y, r: 0.3 } });
  }

  // lake is not walkable
  colliders.push({ kind: 'circle', x: LAKE.x, y: LAKE.y - 3.2, r: 3 });
  colliders.push({ kind: 'circle', x: LAKE.x, y: LAKE.y, r: 3.1 });
  colliders.push({ kind: 'circle', x: LAKE.x, y: LAKE.y + 3.2, r: 3 });

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
    spawn: { x: 23, y: 26.4 },
  };
}
