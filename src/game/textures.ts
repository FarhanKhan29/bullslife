/**
 * Registers every procedural texture with Phaser once, and renders each map's
 * ground (floor tiles, decorations, interior walls) into canvases.
 * Big maps are split into chunks because GPUs limit texture size.
 */
import Phaser from 'phaser';
import * as art from './art';
import * as fur from './furniture';
import type { ArtTexture } from './art';
import { BUILDINGS } from './maps/buildings';
import { GARDEN, LAKE, PLAZA } from './maps/campus';
import type { FloorDecor, Ground, InteriorStyle, MapDef, WallItem } from './maps/types';
import { shade } from '../character/avatarRenderer';

/** Origin (anchor 0..1) and display scale of each registered texture. */
export const ORIGINS = new Map<string, { x: number; y: number; s: number }>();

function register(scene: Phaser.Scene, key: string, t: ArtTexture, res = art.RES) {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, t.canvas);
  ORIGINS.set(key, { x: t.originX, y: t.originY, s: 1 / res });
}

export function registerAllTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fountain')) return;
  const r = (key: string, t: ArtTexture) => register(scene, key, t);
  for (const b of BUILDINGS) register(scene, 'b_' + b.id, art.makeBuilding(b.ext(), b.res ?? art.RES), b.res ?? art.RES);

  // ---- outdoors
  const palettes = ['green', 'green2', 'orange', 'red', 'gold'] as const;
  palettes.forEach((p, i) => {
    r(`tree_${p}_0`, art.tree(p, 11 + i * 7));
    r(`tree_${p}_1`, art.tree(p, 97 + i * 13));
  });
  r('tree_cherry_0', art.tree('cherry', 5));
  r('tree_cherry_1', art.tree('cherry', 77));
  r('pine_0', art.pine(3));
  r('pine_1', art.pine(41));
  r('bush_0', art.bush(1));
  r('bush_1', art.bush(2, '#6cae4f'));
  r('bush_2', art.bush(3, '#d9772b'));
  r('hedge', art.bush(9, '#3f8a54'));
  r('bench_x', art.bench(true));
  r('bench_y', art.bench(false));
  r('lamp', art.lamp());
  r('trash', art.trashCan());
  r('plaque', art.plaque());
  r('fountain', art.fountain());
  r('flagpole', art.flagpole());
  r('flag', art.flag());
  r('bikerack', art.bikeRack());
  r('mapboard', art.mapBoard());
  r('sign_welcome', art.signPost(['WELCOME TO UB', 'North Campus', 'Your Campus. Your People.']));
  r('sign_lake', art.signPost(['Lake LaSalle'], '#2f7d5b'));
  r('sign_coop', art.signPost(['TEAM SWITCHES', 'Stand on A and B', 'with a friend!'], '#d9772b'));
  r('plate_A_off', art.plate(false, 'A'));
  r('plate_A_on', art.plate(true, 'A'));
  r('plate_B_off', art.plate(false, 'B'));
  r('plate_B_on', art.plate(true, 'B'));
  r('portal_arch', art.portalArch());
  r('portal_swirl', art.portalSwirl());
  r('photobooth', art.photoBooth());
  r('statue', art.bullStatue());
  r('lantern', art.lantern());

  // ---- furniture
  r('table_round', art.tableRound());
  r('chair_blue', art.chair('#005bbb'));
  r('chair_gold', art.chair('#f2a93b'));
  r('seatn_blue', fur.seatBack('#005bbb'));
  r('seatn_gold', fur.seatBack('#f2a93b'));
  r('seatn_purple', fur.seatBack('#8a1f2b'));
  r('stool_blue', fur.stool('#005bbb'));
  r('stool_red', fur.stool('#d94b4b'));
  r('info_desk', art.infoDesk());
  r('cafe', art.cafeCounter());
  r('column', art.column());
  r('armchair_gold', art.armchair('#f2a93b'));
  r('armchair_blue', art.armchair('#005bbb'));
  r('study_table', art.studyTable());
  r('vend_a', art.vending('#d94b4b', 'SNACKS'));
  r('vend_b', art.vending('#005bbb', 'DRINKS'));
  r('couch_x', art.couch('#3fae6b', true));
  r('couch_x_orange', art.couch('#f2a93b', true));
  r('couch_y', art.couch('#7a5cd6', false));
  r('coffee_table', art.coffeeTable());
  r('plant', art.plant());
  for (const [k, c] of Object.entries({ blue: '#3d6fb6', red: '#d94b4b', green: '#3fae6b', gold: '#f2a93b', purple: '#7a5cd6' })) {
    r(`bed_${k}`, fur.bed(c, false));
    r(`bed_${k}_x`, fur.bed(c, true));
  }
  r('desk_pc', fur.desk('pc'));
  r('desk_pc_y', fur.desk('pc', false));
  r('desk_lamp', fur.desk('lamp'));
  r('desk_books', fur.desk('books'));
  r('shelf_x', fur.bookshelf(true));
  r('shelf_y', fur.bookshelf(false));
  r('shelf_tall_x', fur.bookshelf(true, 90));
  r('reading_table', fur.readingTable());
  r('bleacher_x', fur.bleacher(3, true));
  r('beanbag_blue', fur.beanbag('#3d6fb6'));
  r('beanbag_orange', fur.beanbag('#f2a93b'));
  r('beanbag_purple', fur.beanbag('#7a5cd6'));
  r('podium', fur.podium());
  r('whiteboard', fur.whiteboardStand());
  r('lab_chem', fur.labBench('chem'));
  r('lab_cs', fur.labBench('cs'));
  r('lab_micro', fur.labBench('micro'));
  r('robot_arm', fur.robotArm());
  r('printer3d', fur.printer3d());
  r('lathe', fur.lathe());
  r('drafting', fur.draftingTable());
  r('shake_table', fur.shakeTable());
  r('hoop_w', fur.hoop(1));
  r('hoop_e', fur.hoop(-1));
  r('goalpost', fur.goalpost());
  r('pingpong', fur.pingpong());
  r('piano', fur.piano());
  r('easel', fur.easel());
  r('sculpture', fur.sculpture());
  r('drums', fur.drumKit());
  r('display_case', fur.displayCase());
  r('trophy_case', fur.trophyCase());
  r('station_pizza', fur.foodStation('#d94b4b', 'PIZZA', ['🍕', '🍕', '🍕']));
  r('station_grill', fur.foodStation('#3b3f46', 'GRILL', ['🍔', '🌭', '🍟']));
  r('station_wings', fur.foodStation('#f2733b', 'BUFFALO WINGS', ['🍗', '🍗', '🥕']));
  r('station_asian', fur.foodStation('#3fae6b', 'NOODLES', ['🍜', '🥟', '🍚']));
  r('station_salad', fur.foodStation('#6cae4f', 'SALAD BAR', ['🥗', '🥒', '🍅']));
  r('station_dessert', fur.foodStation('#ff8fb1', 'DESSERT', ['🍦', '🧁', '🍪']));
  r('station_cafe', fur.foodStation('#6b4428', 'CAFÉ', ['☕', '🥯', '🥤']));
  r('store_shelf_a', fur.storeShelf(['#005bbb', '#ffffff', '#005bbb', '#2b2f38']));
  r('store_shelf_b', fur.storeShelf(['#f2a93b', '#d94b4b', '#3fae6b', '#ffffff']));
  r('checkout', fur.checkout());
  r('kitchen', fur.kitchenCounter());
  r('washer', fur.washer());
  r('tv_stand', fur.tvStand());
  r('partition_x', fur.partition(true));
  r('partition_y', fur.partition(false));
  r('lockers', fur.lockerRow());

  // ---- effects
  r('sparkle', art.sparkle());
  r('confetti', art.confettiPiece());
  r('leaf', art.leaf());
  r('bird', art.bird());
  r('squirrel', art.squirrel());
}

// ---------------------------------------------------------------- ground
const HW = 32;
const HH = 16;
const EDGE = 26; // thickness of the "diorama" earth edge under the campus
const CHUNK = 2048; // max texture width per chunk

type Proj = ReturnType<typeof art.projector>;

export interface GroundChunk {
  canvas: HTMLCanvasElement;
  /** World position of the chunk's top-left corner. */
  x: number;
  y: number;
}

const SIDES: [number, number, number[], number[]][] = [
  [0, -1, [0, 0], [1, 0]],
  [-1, 0, [0, 0], [0, 1]],
  [1, 0, [1, 0], [1, 1]],
  [0, 1, [0, 1], [1, 1]],
];

export function renderGround(map: MapDef): GroundChunk[] {
  const top = (map.wallHeight ?? 0) + 8;
  const ox = map.h * HW + 8;
  const width = (map.w + map.h) * HW + 16;
  const height = (map.w + map.h) * HH + top + EDGE + 8;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  const P = art.projector(ox, top);
  const rand = art.rng(map.id === 'campus' ? 42 : 7);
  const at = (x: number, y: number): Ground | null => (x < 0 || y < 0 || x >= map.w || y >= map.h ? null : map.ground[y][x]);

  if (map.id === 'campus') {
    // earthy diorama edges
    art.quad(ctx, [P(0, map.h), P(map.w, map.h), P(map.w, map.h, -EDGE), P(0, map.h, -EDGE)], '#8a6a4a');
    art.quad(ctx, [P(map.w, 0), P(map.w, map.h), P(map.w, map.h, -EDGE), P(map.w, 0, -EDGE)], '#6e5238');
    art.quad(ctx, [P(0, map.h, -4), P(map.w, map.h, -4), P(map.w, map.h), P(0, map.h)], '#5d9a4c');
    art.quad(ctx, [P(map.w, 0, -4), P(map.w, map.h, -4), P(map.w, map.h), P(map.w, 0)], '#4f8a42');
  }

  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) drawTile(ctx, P, map, x, y);

  // decorations: grass tufts, flowers, fallen leaves, path borders
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const g = map.ground[y][x];
      if (g === 'grass' || g === 'garden') {
        const n = g === 'garden' ? 5 : 2;
        for (let i = 0; i < n; i++) {
          const [px, py] = P(x + rand(), y + rand());
          const kind = rand();
          if (kind < 0.45) {
            ctx.strokeStyle = shade('#80bf69', -0.25);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 2, py);
            ctx.lineTo(px - 1, py - 3);
            ctx.moveTo(px, py);
            ctx.lineTo(px + 1, py - 4);
            ctx.stroke();
          } else if (kind < 0.75 || g === 'garden') {
            ctx.fillStyle = ['#ffffff', '#ffd6e6', '#fff1a6', '#c9b8ff'][Math.floor(rand() * 4)];
            ctx.beginPath();
            ctx.arc(px, py, 1.6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = ['#e8913c', '#d65d3d', '#e8bd3a'][Math.floor(rand() * 3)];
            ctx.beginPath();
            ctx.ellipse(px, py, 2.4, 1.3, rand() * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (g === 'path') {
        for (const [dx, dy, a, b] of SIDES) {
          const n = at(x + dx, y + dy);
          if (n === 'grass' || n === 'garden' || n === 'water') {
            ctx.strokeStyle = '#a99e8c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(...P(x + a[0], y + a[1]));
            ctx.lineTo(...P(x + b[0], y + b[1]));
            ctx.stroke();
          }
        }
      }
    }
  }

  if (map.id === 'campus') drawLake(ctx, P);
  if (map.interior) {
    for (const d of map.interior.floorDecor ?? []) drawFloorDecor(ctx, P, d);
    drawWalls(ctx, P, map, map.interior);
    // exit mat label
    const [px, py] = P(Math.floor(map.w / 2), map.h - 0.5);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', 0, 0);
    ctx.restore();
  }

  // split into chunks that fit in GPU textures
  const chunks: GroundChunk[] = [];
  for (let cx = 0; cx < width; cx += CHUNK) {
    const w = Math.min(CHUNK, width - cx);
    if (w === width) {
      chunks.push({ canvas, x: -ox, y: -top });
      break;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = height;
    c.getContext('2d')!.drawImage(canvas, cx, 0, w, height, 0, 0, w, height);
    chunks.push({ canvas: c, x: -ox + cx, y: -top });
  }
  return chunks;
}

function drawTile(ctx: CanvasRenderingContext2D, P: Proj, map: MapDef, x: number, y: number) {
  const g = map.ground[y][x];
  const pts = [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)];
  const alt = (x + y) % 2 === 1;
  const lines = (color: string, n: number, alongX: boolean, lw = 0.8) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      if (alongX) {
        ctx.moveTo(...P(x, y + i / n));
        ctx.lineTo(...P(x + 1, y + i / n));
      } else {
        ctx.moveTo(...P(x + i / n, y));
        ctx.lineTo(...P(x + i / n, y + 1));
      }
    }
    ctx.stroke();
  };
  switch (g) {
    case 'grass':
    case 'water': {
      const base = alt ? '#86c46e' : '#80bf69';
      art.quad(ctx, pts, base, base, 0.6);
      break;
    }
    case 'garden':
      art.quad(ctx, pts, '#8fd47a', '#8fd47a', 0.6);
      break;
    case 'path': {
      // UB Academic Spine style hexagonal pavers
      art.quad(ctx, pts, '#c9c0b2', '#c9c0b2', 0.6);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const hx = x + (i + 0.5 + (j % 2 ? 0.5 : 0)) / 3;
          const hy = y + (j + 0.5) / 3;
          if (hx > x + 1) continue;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            const p = P(hx + Math.cos(a) * 0.15, hy + Math.sin(a) * 0.15);
            k === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
          }
          ctx.closePath();
          ctx.fillStyle = (i + j + x + y) % 3 === 0 ? '#ddd5c7' : '#d6cdbf';
          ctx.fill();
        }
      }
      break;
    }
    case 'plaza': {
      const d = Math.hypot(x + 0.5 - PLAZA.x, y + 0.5 - PLAZA.y);
      art.quad(ctx, pts, Math.floor(d * 1.2) % 2 ? '#dcb894' : '#d0a984', '#b98f6a', 0.8);
      break;
    }
    case 'booth':
      art.quad(ctx, pts, alt ? '#ffd27a' : '#f7c45c', '#d9772b', 1);
      break;
    case 'wood':
      art.quad(ctx, pts, alt ? '#d2a273' : '#c99868', '#a97b50', 0.6);
      lines('rgba(120,80,40,0.25)', 3, false);
      break;
    case 'darkwood':
    case 'stage':
      art.quad(ctx, pts, alt ? '#6b4428' : '#5e3b22', '#4a2e1a', 0.6);
      lines('rgba(0,0,0,0.2)', 3, false);
      break;
    case 'court':
      art.quad(ctx, pts, alt ? '#ddb06e' : '#d6a865', '#c4965a', 0.4);
      lines('rgba(140,90,40,0.25)', 4, false, 0.6);
      break;
    case 'turf':
      art.quad(ctx, pts, x % 4 < 2 ? '#4f9a4a' : '#5aa654', x % 4 < 2 ? '#4f9a4a' : '#5aa654', 0.6);
      break;
    case 'carpet':
      art.quad(ctx, pts, alt ? '#64748b' : '#5e6e85', '#56657a', 0.5);
      break;
    case 'lino':
      art.quad(ctx, pts, alt ? '#dfe3e6' : '#d2d8dc', '#c3c9ce', 0.6);
      break;
    case 'concrete':
      art.quad(ctx, pts, alt ? '#a9a7a2' : '#a3a19c', '#96948f', 0.6);
      break;
    case 'rug':
      art.quad(ctx, pts, alt ? '#1f6cc6' : '#1a62b6', '#155299', 0.6);
      break;
    case 'tile':
      // grey terrazzo tiles with navy accent strips (like the real SU lobby)
      art.quad(ctx, pts, alt ? '#b9b7b2' : '#b3b1ac', '#a19f99', 0.6);
      ctx.strokeStyle = '#2d3a5c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (x % 4 === 0) {
        ctx.moveTo(...P(x, y));
        ctx.lineTo(...P(x, y + 1));
      }
      if (y % 4 === 0) {
        ctx.moveTo(...P(x, y));
        ctx.lineTo(...P(x + 1, y));
      }
      ctx.stroke();
      break;
    case 'mat':
      art.quad(ctx, pts, '#4b5563', '#2b313a', 1);
      break;
  }
}

/** Lake LaSalle: a smooth shoreline drawn over the grass. */
function drawLake(ctx: CanvasRenderingContext2D, P: Proj) {
  const ring = (k: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const wob = 1 + Math.sin(a * 5) * 0.03;
      const p = P(LAKE.x + Math.cos(a) * LAKE.rx * k * wob, LAKE.y + Math.sin(a) * LAKE.ry * k * wob);
      i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
    }
    ctx.closePath();
  };
  ring(1.07);
  ctx.fillStyle = '#e3d3a2';
  ctx.fill();
  ring(1);
  const [cx, cy] = P(LAKE.x, LAKE.y);
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, LAKE.rx * 40);
  g.addColorStop(0, '#3f8fc4');
  g.addColorStop(1, '#6cbbe6');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  const rand = art.rng(9);
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.8;
    const [px, py] = P(LAKE.x + Math.cos(a) * LAKE.rx * r, LAKE.y + Math.sin(a) * LAKE.ry * r);
    ctx.beginPath();
    ctx.ellipse(px, py, 8, 2.5, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  void GARDEN;
}

// ---------------------------------------------------------------- floor decorations
function rectPath(ctx: CanvasRenderingContext2D, P: Proj, x0: number, y0: number, x1: number, y1: number) {
  ctx.beginPath();
  ctx.moveTo(...P(x0, y0));
  ctx.lineTo(...P(x1, y0));
  ctx.lineTo(...P(x1, y1));
  ctx.lineTo(...P(x0, y1));
  ctx.closePath();
}

function gridCircle(ctx: CanvasRenderingContext2D, P: Proj, cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2) {
  ctx.beginPath();
  for (let i = 0; i <= 32; i++) {
    const a = a0 + ((a1 - a0) * i) / 32;
    const p = P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
  }
}

function flatText(ctx: CanvasRenderingContext2D, P: Proj, x: number, y: number, text: string, size: number, color: string) {
  const [px, py] = P(x, y);
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(1, 0.5);
  ctx.rotate(Math.PI / 4 - Math.PI / 4);
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawFloorDecor(ctx: CanvasRenderingContext2D, P: Proj, d: FloorDecor) {
  if (d.kind === 'seal') return drawSeal(ctx, P, d.x, d.y, d.r);
  if (d.kind === 'rug') {
    rectPath(ctx, P, d.x0, d.y0, d.x1, d.y1);
    ctx.fillStyle = d.border;
    ctx.fill();
    rectPath(ctx, P, d.x0 + 0.3, d.y0 + 0.3, d.x1 - 0.3, d.y1 - 0.3);
    ctx.fillStyle = d.color;
    ctx.fill();
    return;
  }
  if (d.kind === 'stage') {
    rectPath(ctx, P, d.x0, d.y0, d.x1, d.y1);
    ctx.fillStyle = '#4a2e1a';
    ctx.fill();
    for (let x = d.x0; x < d.x1; x += 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(...P(x, d.y0));
      ctx.lineTo(...P(x, d.y1));
      ctx.stroke();
    }
    ctx.strokeStyle = '#c9a54a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...P(d.x0, d.y1));
    ctx.lineTo(...P(d.x1, d.y1));
    ctx.stroke();
    return;
  }
  if (d.kind === 'court') {
    const midX = (d.x0 + d.x1) / 2;
    const midY = (d.y0 + d.y1) / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    rectPath(ctx, P, d.x0, d.y0, d.x1, d.y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(...P(midX, d.y0));
    ctx.lineTo(...P(midX, d.y1));
    ctx.stroke();
    gridCircle(ctx, P, midX, midY, 1.8);
    ctx.fillStyle = 'rgba(0,91,187,0.85)';
    ctx.fill();
    ctx.stroke();
    flatText(ctx, P, midX, midY, 'UB', 26, '#ffffff');
    for (const [x, dir] of [
      [d.x0, 1],
      [d.x1, -1],
    ] as [number, number][]) {
      // painted key
      rectPath(ctx, P, Math.min(x, x + dir * 3.2), midY - 1.2, Math.max(x, x + dir * 3.2), midY + 1.2);
      ctx.fillStyle = 'rgba(0,91,187,0.75)';
      ctx.fill();
      ctx.stroke();
      // three-point arc
      gridCircle(ctx, P, x, midY, 4.6, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : (Math.PI * 3) / 2);
      ctx.stroke();
    }
    return;
  }
  if (d.kind === 'field') {
    // end zones
    for (const [a, b] of [
      [d.x0, d.x0 + 2],
      [d.x1 - 2, d.x1],
    ]) {
      rectPath(ctx, P, a, d.y0, b, d.y1);
      ctx.fillStyle = '#005bbb';
      ctx.fill();
      flatText(ctx, P, (a + b) / 2, (d.y0 + d.y1) / 2, 'BULLS', 16, '#ffffff');
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    rectPath(ctx, P, d.x0, d.y0, d.x1, d.y1);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let x = d.x0 + 2; x <= d.x1 - 2; x += 1.6) {
      ctx.beginPath();
      ctx.moveTo(...P(x, d.y0));
      ctx.lineTo(...P(x, d.y1));
      ctx.stroke();
    }
    const midX = (d.x0 + d.x1) / 2;
    gridCircle(ctx, P, midX, (d.y0 + d.y1) / 2, 1.6);
    ctx.fillStyle = 'rgba(0,91,187,0.9)';
    ctx.fill();
    flatText(ctx, P, midX, (d.y0 + d.y1) / 2, 'UB', 20, '#ffffff');
  }
}

/** The university seal medallion inlaid in the SU lobby floor (original stylised drawing). */
function drawSeal(ctx: CanvasRenderingContext2D, P: Proj, x: number, y: number, r: number) {
  const [cx, cy] = P(x, y);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.5);
  ctx.rotate(Math.PI / 4);
  const R = r * 32 * Math.SQRT2 * 0.72;
  const disc = (rad: number, fill: string) => {
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  disc(R + 6, '#d9d4ca');
  disc(R, '#1f2f5c');
  disc(R * 0.7, '#efe8d8');
  ctx.strokeStyle = '#c9a54a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  const text = 'UNIVERSITY AT BUFFALO  •  MDCCCXLVI  •  ';
  ctx.fillStyle = '#efe8d8';
  ctx.font = `bold ${Math.round(R * 0.16)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate((i / text.length) * Math.PI * 2);
    ctx.translate(0, -R * 0.85);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.fillStyle = '#1f2f5c';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.05, R * 0.2, R * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-R * 0.16, -R * 0.12);
  ctx.quadraticCurveTo(-R * 0.42, -R * 0.2, -R * 0.36, -R * 0.4);
  ctx.quadraticCurveTo(-R * 0.3, -R * 0.24, -R * 0.1, -R * 0.2);
  ctx.moveTo(R * 0.16, -R * 0.12);
  ctx.quadraticCurveTo(R * 0.42, -R * 0.2, R * 0.36, -R * 0.4);
  ctx.quadraticCurveTo(R * 0.3, -R * 0.24, R * 0.1, -R * 0.2);
  ctx.fill();
  ctx.strokeStyle = '#3f7a4a';
  ctx.lineWidth = 2.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(0, R * 0.05, R * 0.46, Math.PI / 2 + s * 0.35, Math.PI / 2 + s * 1.5, s < 0);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- interior walls
function wallText(ctx: CanvasRenderingContext2D, at: [number, number], wall: 'n' | 'w', lines: string[], color: string, size: number) {
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.transform(1, wall === 'n' ? 0.5 : -0.5, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    ctx.font = `bold ${i === 0 ? size : Math.round(size * 0.7)}px system-ui, sans-serif`;
    ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.15);
  });
  ctx.restore();
}

function drawWallItem(ctx: CanvasRenderingContext2D, P: Proj, it: WallItem) {
  const F = (u: number, z: number): [number, number] => (it.wall === 'n' ? P(u, 0, z) : P(0, u, z));
  const R = (u0: number, u1: number, z0: number, z1: number, fill: string | CanvasGradient, stroke?: string, lw = 1) =>
    art.quad(ctx, [F(u0, z0), F(u1, z0), F(u1, z1), F(u0, z1)], fill as string, stroke, lw);
  const { u, w, z, h } = it;
  const mid = F(u + w / 2, z + h / 2);
  const rand = art.rng(Math.round(u * 13 + z));
  switch (it.kind) {
    case 'window': {
      const g = ctx.createLinearGradient(...F(u, z + h), ...F(u + w, z));
      g.addColorStop(0, it.color ?? '#cfe9f8');
      g.addColorStop(1, it.color ? shade(it.color, -0.2) : '#8fc4e6');
      R(u, u + w, z, z + h, g, '#5b7b94', 2);
      for (let m = u + 0.7; m < u + w; m += 0.7) R(m - 0.02, m + 0.02, z, z + h, '#ffffff');
      ctx.save();
      ctx.globalAlpha = 0.35;
      art.quad(ctx, [F(u + 0.15, z + h - 4), F(u + 0.4, z + h - 4), F(u + 0.3, z + 6), F(u + 0.1, z + 6)], '#ffffff');
      ctx.restore();
      if (it.text) wallText(ctx, mid, it.wall, it.text, '#2b4a63', 9);
      break;
    }
    case 'banner':
    case 'sign':
    case 'poster':
      R(u, u + w, z, z + h, it.color ?? '#005bbb', '#00000033', 1);
      if (it.text) wallText(ctx, mid, it.wall, it.text, '#ffffff', it.kind === 'sign' ? Math.min(11, h * 0.5) : 10);
      break;
    case 'menu':
      R(u, u + w, z, z + h, it.color ?? '#2b2f38', '#000', 1);
      if (it.text) wallText(ctx, mid, it.wall, it.text, '#ffd75e', 9);
      break;
    case 'board': {
      R(u, u + w, z, z + h, '#c49a62', '#7a5a2a', 2);
      const notes = ['#fff1a6', '#ffd6e6', '#c9f0ff', '#d6ffc9', '#ffffff', '#ffe0b3'];
      for (let i = 0; i < 6; i++) {
        const nu = u + 0.15 + (i % 3) * (w / 3.2);
        const nz = z + 4 + Math.floor(i / 3) * (h / 2.2);
        R(nu, nu + w / 4.2, nz, nz + h / 2.8, notes[i], '#00000022', 0.5);
      }
      break;
    }
    case 'whiteboard':
    case 'chalk': {
      const chalk = it.kind === 'chalk';
      R(u, u + w, z, z + h, chalk ? '#2f5d4a' : '#fbfbf8', '#9aa3ad', 2);
      ctx.strokeStyle = chalk ? 'rgba(255,255,255,0.8)' : '#3d86bf';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const zz = z + h - 8 - i * (h / 5);
        ctx.moveTo(...F(u + 0.2, zz));
        ctx.lineTo(...F(u + 0.2 + (w - 0.4) * (0.4 + rand() * 0.5), zz));
      }
      ctx.stroke();
      break;
    }
    case 'screen': {
      R(u, u + w, z, z + h, '#f4f6f8', '#2b2f38', 2);
      R(u + 0.15, u + w - 0.15, z + 4, z + h - 4, '#1f5fbf');
      if (it.text) wallText(ctx, mid, it.wall, it.text, '#ffffff', 12);
      break;
    }
    case 'scoreboard':
      R(u, u + w, z, z + h, '#111318', '#000', 2);
      if (it.text) wallText(ctx, mid, it.wall, it.text, '#ffb63b', 12);
      break;
    case 'shelf': {
      R(u, u + w, z, z + h, '#6b4428', '#3b2618', 1);
      const colors = ['#d94b4b', '#005bbb', '#3fae6b', '#f2a93b', '#7a5cd6', '#2b2f38', '#e8d5b5'];
      for (let sz = z + 3; sz + 12 < z + h; sz += 14) {
        for (let su = u + 0.05; su < u + w - 0.1; su += 0.09) {
          const c = colors[Math.floor(rand() * colors.length)];
          R(su, su + 0.07, sz, sz + 9 + rand() * 3, it.wall === 'n' ? c : shade(c, -0.12));
        }
      }
      break;
    }
    case 'tv':
      R(u, u + w, z, z + h, '#111', '#000', 1);
      R(u + 0.08, u + w - 0.08, z + 3, z + h - 3, '#2d6aa8');
      break;
    case 'art': {
      R(u - 0.08, u + w + 0.08, z - 3, z + h + 3, '#c9a54a', '#7a5a1a', 1);
      R(u, u + w, z, z + h, '#fbf8f0');
      const c = it.color ?? '#3e7aa8';
      R(u + 0.1, u + w - 0.1, z + 3, z + h * 0.5, c);
      R(u + w * 0.3, u + w * 0.7, z + h * 0.4, z + h - 4, shade(c, 0.35));
      break;
    }
    case 'door':
      R(u, u + w, z === 0 ? 0 : 0, 44, '#8a5a3a', '#4a2e1a', 1.5);
      R(u + w - 0.25, u + w - 0.15, 20, 24, '#e8bd3a');
      break;
    case 'lockers':
      R(u, u + w, z, z + h, '#3d6fb6', '#2a5290', 1);
      for (let lu = u + 0.4; lu < u + w; lu += 0.4) R(lu - 0.02, lu + 0.02, z, z + h, '#2a5290');
      break;
    case 'clock': {
      const [cx, cy] = mid;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#22252b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 6);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 4, cy + 1);
      ctx.stroke();
      break;
    }
    case 'trophy':
    case 'mirror':
      R(u, u + w, z, z + h, it.kind === 'mirror' ? '#dfeef5' : '#3b2618', '#7a5a1a', 1);
      break;
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, P: Proj, map: MapDef, s: InteriorStyle) {
  const H = s.wallHeight;
  const W = map.w;
  const D = map.h;
  art.quad(ctx, [P(0, 0), P(W, 0), P(W, 0, H), P(0, 0, H)], s.wall, shade(s.wall, -0.2), 1);
  art.quad(ctx, [P(0, 0), P(0, D), P(0, D, H), P(0, 0, H)], s.wallSide, shade(s.wallSide, -0.2), 1);
  if (s.base) {
    art.quad(ctx, [P(0, 0), P(W, 0), P(W, 0, 18), P(0, 0, 18)], s.base, shade(s.base, -0.3), 1);
    art.quad(ctx, [P(0, 0), P(0, D), P(0, D, 18), P(0, 0, 18)], shade(s.base, -0.08), shade(s.base, -0.3), 1);
  }
  art.quad(ctx, [P(0, 0, H - 6), P(W, 0, H - 6), P(W, 0, H), P(0, 0, H)], s.trim);
  art.quad(ctx, [P(0, 0, H - 6), P(0, D, H - 6), P(0, D, H), P(0, 0, H)], shade(s.trim, -0.12));
  if (s.balcony) drawBalcony(ctx, P, W, D, H, s);
  for (const it of s.items) drawWallItem(ctx, P, it);
  // front cut-away edges so players stay visible
  const mid = Math.floor(W / 2);
  const edge = shade(s.wallSide, -0.35);
  art.quad(ctx, [P(0, D), P(mid - 1, D), P(mid - 1, D, -10), P(0, D, -10)], edge);
  art.quad(ctx, [P(mid + 1, D), P(W, D), P(W, D, -10), P(mid + 1, D, -10)], edge);
  art.quad(ctx, [P(W, 0), P(W, D), P(W, D, -10), P(W, 0, -10)], shade(edge, -0.1));
}

/** Student Union atrium: second-floor balcony, black railings, banners, open stairs. */
function drawBalcony(ctx: CanvasRenderingContext2D, P: Proj, W: number, D: number, H: number, s: InteriorStyle) {
  const BAL = 70;
  art.quad(ctx, [P(0, 0, BAL + 10), P(W, 0, BAL + 10), P(W, 0, H - 6), P(0, 0, H - 6)], '#e9e5dc');
  art.quad(ctx, [P(0, 0, BAL + 10), P(0, D, BAL + 10), P(0, D, H - 6), P(0, 0, H - 6)], '#dcd8ce');
  for (let x = 1; x < W - 1; x += 2.6) art.quad(ctx, [P(x, 0, BAL + 18), P(x + 1.4, 0, BAL + 18), P(x + 1.4, 0, BAL + 58), P(x, 0, BAL + 58)], '#9fc3d8', '#5b7b94', 1.2);
  for (let y = 1.5; y < D - 1; y += 3) art.quad(ctx, [P(0, y, BAL + 18), P(0, y + 1.2, BAL + 18), P(0, y + 1.2, BAL + 52), P(0, y, BAL + 52)], '#b98a5a', '#7a5a2a', 1);
  ctx.save();
  ctx.globalAlpha = 0.12;
  art.quad(ctx, [P(0, 0, BAL - 14), P(W, 0, BAL - 14), P(W, 0, BAL), P(0, 0, BAL)], '#000');
  art.quad(ctx, [P(0, 0, BAL - 14), P(0, D, BAL - 14), P(0, D, BAL), P(0, 0, BAL)], '#000');
  ctx.restore();
  art.quad(ctx, [P(0, 0.9, BAL), P(W, 0.9, BAL), P(W, 0.9, BAL + 10), P(0, 0.9, BAL + 10)], '#ffffff', '#c9c4ba', 1);
  art.quad(ctx, [P(0.9, 0.9, BAL), P(0.9, D, BAL), P(0.9, D, BAL + 10), P(0.9, 0.9, BAL + 10)], '#f0ede6', '#c9c4ba', 1);
  ctx.strokeStyle = '#22252b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = 0.9; x <= W; x += 0.18) {
    ctx.moveTo(...P(x, 0.9, BAL + 10));
    ctx.lineTo(...P(x, 0.9, BAL + 26));
  }
  for (let y = 0.9; y <= D; y += 0.18) {
    ctx.moveTo(...P(0.9, y, BAL + 10));
    ctx.lineTo(...P(0.9, y, BAL + 26));
  }
  ctx.stroke();
  ctx.strokeStyle = '#c9a87a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(...P(W, 0.9, BAL + 26));
  ctx.lineTo(...P(0.9, 0.9, BAL + 26));
  ctx.lineTo(...P(0.9, D, BAL + 26));
  ctx.stroke();
  const banner = (x: number, w: number, color: string, lines: string[]) => {
    art.quad(ctx, [P(x, 0.9, BAL + 24), P(x + w, 0.9, BAL + 24), P(x + w, 0.9, BAL - 8), P(x, 0.9, BAL - 8)], color, '#00000044', 1);
    wallText(ctx, P(x + w / 2, 0.9, BAL + 8), 'n', lines, '#ffffff', 12);
  };
  banner(2.2, 3, '#005bbb', ['GO BULLS!', 'UB ATHLETICS']);
  banner(10.4, 3.2, '#d94b4b', ['WELCOME', 'BACK, BULLS!']);
  // ground floor: elevator, bulletin board, lettering
  art.quad(ctx, [P(11, 0, 0), P(12.4, 0, 0), P(12.4, 0, 40), P(11, 0, 40)], '#b9c0c8', '#7b8896', 1.2);
  drawWallItem(ctx, P, { wall: 'n', u: 2.6, w: 2, z: 18, h: 24, kind: 'board' });
  wallText(ctx, P(8, 0, 56), 'n', ['STUDENT UNION'], '#c9a54a', 13);
  if (s.stairs) {
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const y0 = D - 1.6 - i * 0.5;
      const z = (i + 1) * (BAL / steps);
      art.quad(ctx, [P(0, y0, z), P(0.9, y0, z), P(0.9, y0 - 0.5, z), P(0, y0 - 0.5, z)], '#cfc9bd', '#9a958c', 0.6);
      art.quad(ctx, [P(0.9, y0, z - BAL / steps), P(0.9, y0, z), P(0.9, y0 - 0.5, z), P(0.9, y0 - 0.5, z - BAL / steps)], '#b9b4aa');
    }
    ctx.strokeStyle = '#22252b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(...P(0.9, D - 1.6, 18));
    ctx.lineTo(...P(0.9, D - 1.6 - steps * 0.5, BAL + 18));
    ctx.stroke();
  }
}
