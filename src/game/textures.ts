/**
 * Registers every procedural texture with Phaser once, and renders map ground
 * layers (tiles + interior walls) into a single canvas per map for speed.
 */
import Phaser from 'phaser';
import * as art from './art';
import { capenHall, davisHall, studentUnion } from './ubBuildings';
import type { ArtTexture } from './art';
import type { Ground, MapDef } from './maps/types';
import { shade } from '../character/avatarRenderer';
import { UNION_SEAL } from './maps/union';

/** Origin (anchor) of each registered texture, 0..1. */
export const ORIGINS = new Map<string, { x: number; y: number }>();

function register(scene: Phaser.Scene, key: string, t: ArtTexture) {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, t.canvas);
  ORIGINS.set(key, { x: t.originX, y: t.originY });
}

export function registerAllTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fountain')) return;
  const b = (key: string, spec: art.BuildingSpec) => register(scene, key, art.makeBuilding(spec));
  b('b_union', studentUnion());
  b('b_capen', capenHall());
  b('b_davis', davisHall());

  const palettes = ['green', 'green2', 'orange', 'red', 'gold'] as const;
  palettes.forEach((p, i) => {
    register(scene, `tree_${p}_0`, art.tree(p, 11 + i * 7));
    register(scene, `tree_${p}_1`, art.tree(p, 97 + i * 13));
  });
  register(scene, 'tree_cherry_0', art.tree('cherry', 5));
  register(scene, 'tree_cherry_1', art.tree('cherry', 77));
  register(scene, 'pine_0', art.pine(3));
  register(scene, 'pine_1', art.pine(41));
  register(scene, 'bush_0', art.bush(1));
  register(scene, 'bush_1', art.bush(2, '#6cae4f'));
  register(scene, 'bush_2', art.bush(3, '#d9772b'));
  register(scene, 'hedge', art.bush(9, '#3f8a54'));
  register(scene, 'bench_x', art.bench(true));
  register(scene, 'bench_y', art.bench(false));
  register(scene, 'lamp', art.lamp());
  register(scene, 'trash', art.trashCan());
  register(scene, 'plaque', art.plaque());
  register(scene, 'fountain', art.fountain());
  register(scene, 'flagpole', art.flagpole());
  register(scene, 'flag', art.flag());
  register(scene, 'bikerack', art.bikeRack());
  register(scene, 'mapboard', art.mapBoard());
  register(scene, 'sign_welcome', art.signPost(['WELCOME TO UB', 'North Campus', 'Your Campus. Your People.']));
  register(scene, 'sign_su', art.signPost(['Student Union']));
  register(scene, 'sign_capen', art.signPost(['Capen Hall', 'Library']));
  register(scene, 'sign_davis', art.signPost(['Davis Hall', 'Engineering']));
  register(scene, 'sign_lake', art.signPost(['Lake LaSalle'], '#2f7d5b'));
  register(scene, 'sign_coop', art.signPost(['TEAM SWITCHES', 'Stand on A and B', 'with a friend!'], '#d9772b'));
  register(scene, 'plate_A_off', art.plate(false, 'A'));
  register(scene, 'plate_A_on', art.plate(true, 'A'));
  register(scene, 'plate_B_off', art.plate(false, 'B'));
  register(scene, 'plate_B_on', art.plate(true, 'B'));
  register(scene, 'portal_arch', art.portalArch());
  register(scene, 'portal_swirl', art.portalSwirl());
  register(scene, 'photobooth', art.photoBooth());
  register(scene, 'statue', art.bullStatue());
  register(scene, 'lantern', art.lantern());
  register(scene, 'table_round', art.tableRound());
  register(scene, 'chair_blue', art.chair('#005bbb'));
  register(scene, 'chair_gold', art.chair('#f2a93b'));
  register(scene, 'desk', art.counterDesk());
  register(scene, 'info_desk', art.infoDesk());
  register(scene, 'cafe', art.cafeCounter());
  register(scene, 'column', art.column());
  register(scene, 'armchair_gold', art.armchair('#f2a93b'));
  register(scene, 'armchair_blue', art.armchair('#005bbb'));
  register(scene, 'study_table', art.studyTable());
  register(scene, 'vend_a', art.vending('#d94b4b', 'SNACKS'));
  register(scene, 'vend_b', art.vending('#005bbb', 'DRINKS'));
  register(scene, 'couch_x', art.couch('#3fae6b', true));
  register(scene, 'couch_x_orange', art.couch('#f2a93b', true));
  register(scene, 'couch_y', art.couch('#7a5cd6', false));
  register(scene, 'coffee_table', art.coffeeTable());
  register(scene, 'plant', art.plant());
  register(scene, 'sparkle', art.sparkle());
  register(scene, 'confetti', art.confettiPiece());
  register(scene, 'leaf', art.leaf());
  register(scene, 'bird', art.bird());
  register(scene, 'squirrel', art.squirrel());
}

// ---------- ground ----------
const HW = 32;
const HH = 16;
const EDGE = 26; // thickness of the "diorama" earth edge under outdoor maps

export interface GroundLayer {
  canvas: HTMLCanvasElement;
  /** World position of the canvas' top-left corner. */
  offsetX: number;
  offsetY: number;
}

export function renderGround(map: MapDef): GroundLayer {
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

  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const g = map.ground[y][x];
      const pts = [P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)];
      switch (g) {
        case 'grass':
        case 'garden': {
          const base = g === 'garden' ? '#8fd47a' : (x + y) % 2 ? '#86c46e' : '#80bf69';
          art.quad(ctx, pts, base, base, 0.6);
          break;
        }
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
          const d = Math.hypot(x + 0.5 - 23, y + 0.5 - 21);
          const ring = Math.floor(d * 1.2) % 2;
          art.quad(ctx, pts, ring ? '#dcb894' : '#d0a984', '#b98f6a', 0.8);
          break;
        }
        case 'water':
          art.quad(ctx, pts, '#5aaee0', '#5aaee0', 0.6);
          break;
        case 'booth':
          art.quad(ctx, pts, (x + y) % 2 ? '#ffd27a' : '#f7c45c', '#d9772b', 1);
          break;
        case 'wood': {
          art.quad(ctx, pts, (x + y) % 2 ? '#d2a273' : '#c99868', '#a97b50', 0.6);
          ctx.strokeStyle = 'rgba(120,80,40,0.25)';
          ctx.lineWidth = 0.8;
          for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(...P(x + i / 3, y));
            ctx.lineTo(...P(x + i / 3, y + 1));
            ctx.stroke();
          }
          break;
        }
        case 'rug': {
          const border = x === 9 || x === 14 || y === 2 || y === 7;
          art.quad(ctx, pts, border ? '#f2a93b' : (x + y) % 2 ? '#1f6cc6' : '#1a62b6', border ? '#d9772b' : '#155299', 0.6);
          break;
        }
        case 'tile':
          // grey terrazzo-style tiles with navy accent strips (like the real SU lobby)
          art.quad(ctx, pts, (x + y) % 2 ? '#b9b7b2' : '#b3b1ac', '#a19f99', 0.6);
          if (x % 4 === 0) {
            ctx.strokeStyle = '#2d3a5c';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(...P(x, y));
            ctx.lineTo(...P(x, y + 1));
            ctx.stroke();
          }
          if (y % 4 === 0) {
            ctx.strokeStyle = '#2d3a5c';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(...P(x, y));
            ctx.lineTo(...P(x + 1, y));
            ctx.stroke();
          }
          break;
        case 'mat':
          art.quad(ctx, pts, '#4b5563', '#2b313a', 1);
          break;
      }
    }
  }

  // decorations: grass tufts, flowers, fallen leaves, water ripples
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
      if (g === 'water') {
        // shoreline sand where water meets land
        for (const [dx, dy, a, b] of [
          [0, -1, [0, 0], [1, 0]],
          [-1, 0, [0, 0], [0, 1]],
          [1, 0, [1, 0], [1, 1]],
          [0, 1, [0, 1], [1, 1]],
        ] as [number, number, number[], number[]][]) {
          const n = at(x + dx, y + dy);
          if (n && n !== 'water') {
            ctx.strokeStyle = '#e9d9a8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(...P(x + a[0], y + a[1]));
            ctx.lineTo(...P(x + b[0], y + b[1]));
            ctx.stroke();
          }
        }
        if (rand() < 0.35) {
          const [px, py] = P(x + 0.5, y + 0.5);
          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 2.5, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (g === 'path') {
        // soft border where path meets grass
        for (const [dx, dy, a, b] of [
          [0, -1, [0, 0], [1, 0]],
          [-1, 0, [0, 0], [0, 1]],
          [1, 0, [1, 0], [1, 1]],
          [0, 1, [0, 1], [1, 1]],
        ] as [number, number, number[], number[]][]) {
          const n = at(x + dx, y + dy);
          if (n === 'grass' || n === 'garden') {
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

  if (map.id === 'union') {
    drawSeal(ctx, P);
    drawInteriorWalls(ctx, P, map);
  }
  if (map.id === 'union') {
    const [px, py] = P(8, map.h - 0.5);
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

  return { canvas, offsetX: -ox, offsetY: -top };
}

/** The university seal medallion inlaid in the lobby floor (original stylised drawing). */
function drawSeal(ctx: CanvasRenderingContext2D, P: ReturnType<typeof art.projector>) {
  const { x, y, r } = UNION_SEAL;
  const [cx, cy] = P(x, y);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.5);
  ctx.rotate(Math.PI / 4);
  const R = r * 32 * Math.SQRT2 * 0.72;
  const ring = (rad: number, fill: string) => {
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  ring(R + 6, '#d9d4ca');
  ring(R, '#1f2f5c');
  ring(R * 0.7, '#efe8d8');
  ctx.strokeStyle = '#c9a54a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  // lettering around the ring
  const text = 'UNIVERSITY AT BUFFALO  •  MDCCCXLVI  •  ';
  ctx.fillStyle = '#efe8d8';
  ctx.font = `bold ${Math.round(R * 0.16)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < text.length; i++) {
    const a = (i / text.length) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -R * 0.85);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  // centre emblem: a simple bull head + laurel (original design)
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

/**
 * Back walls of the round atrium: white walls, a second-floor balcony with
 * black railings, hanging banners, bulletin boards and an open staircase.
 */
function drawInteriorWalls(ctx: CanvasRenderingContext2D, P: ReturnType<typeof art.projector>, map: MapDef) {
  const H = map.wallHeight ?? 150;
  const W = map.w;
  const D = map.h;
  const BAL = 70; // balcony slab height
  // walls
  art.quad(ctx, [P(0, 0), P(W, 0), P(W, 0, H), P(0, 0, H)], '#f2efe8', '#c9c4ba', 1);
  art.quad(ctx, [P(0, 0), P(0, D), P(0, D, H), P(0, 0, H)], '#e4e0d7', '#c9c4ba', 1);
  // upper floor (set back, a little darker) above the balcony
  art.quad(ctx, [P(0, 0, BAL + 10), P(W, 0, BAL + 10), P(W, 0, H), P(0, 0, H)], '#e9e5dc');
  art.quad(ctx, [P(0, 0, BAL + 10), P(0, D, BAL + 10), P(0, D, H), P(0, 0, H)], '#dcd8ce');
  // upper-floor doors/windows (offices, Student Association)
  for (let x = 1; x < W - 1; x += 2.6) art.quad(ctx, [P(x, 0, BAL + 18), P(x + 1.4, 0, BAL + 18), P(x + 1.4, 0, BAL + 58), P(x, 0, BAL + 58)], '#9fc3d8', '#5b7b94', 1.2);
  for (let y = 1.5; y < D - 1; y += 3) art.quad(ctx, [P(0, y, BAL + 18), P(0, y + 1.2, BAL + 18), P(0, y + 1.2, BAL + 52), P(0, y, BAL + 52)], '#b98a5a', '#7a5a2a', 1);
  // curved ceiling coffer hint
  art.quad(ctx, [P(0, 0, H - 8), P(W, 0, H - 8), P(W, 0, H), P(0, 0, H)], '#ffffff');
  art.quad(ctx, [P(0, 0, H - 8), P(0, D, H - 8), P(0, D, H), P(0, 0, H)], '#f4f1ea');
  // under-balcony shadow + slab
  ctx.save();
  ctx.globalAlpha = 0.12;
  art.quad(ctx, [P(0, 0, BAL - 14), P(W, 0, BAL - 14), P(W, 0, BAL), P(0, 0, BAL)], '#000');
  art.quad(ctx, [P(0, 0, BAL - 14), P(0, D, BAL - 14), P(0, D, BAL), P(0, 0, BAL)], '#000');
  ctx.restore();
  art.quad(ctx, [P(0, 0.9, BAL), P(W, 0.9, BAL), P(W, 0.9, BAL + 10), P(0, 0.9, BAL + 10)], '#ffffff', '#c9c4ba', 1);
  art.quad(ctx, [P(0.9, 0.9, BAL), P(0.9, D, BAL), P(0.9, D, BAL + 10), P(0.9, 0.9, BAL + 10)], '#f0ede6', '#c9c4ba', 1);
  art.quad(ctx, [P(0, 0, BAL + 10), P(W, 0, BAL + 10), P(W, 0.9, BAL + 10), P(0.9, 0.9, BAL + 10), P(0.9, D, BAL + 10), P(0, D, BAL + 10)], '#d9d4ca');
  // black railings on the balcony edge
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
  // banners hanging from the railing
  const bannerN = (x: number, w: number, color: string, lines: string[]) => {
    art.quad(ctx, [P(x, 0.9, BAL + 24), P(x + w, 0.9, BAL + 24), P(x + w, 0.9, BAL - 8), P(x, 0.9, BAL - 8)], color, '#00000044', 1);
    ctx.save();
    const [tx, ty] = P(x + w / 2, 0.9, BAL + 8);
    ctx.translate(tx, ty);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      ctx.font = i === 0 ? 'bold 12px system-ui, sans-serif' : 'bold 7px system-ui, sans-serif';
      ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * 13);
    });
    ctx.restore();
  };
  bannerN(2.2, 3, '#005bbb', ['GO BULLS!', 'UB ATHLETICS']);
  bannerN(10.4, 3.2, '#d94b4b', ['WELCOME', 'BACK, BULLS!']);
  // clock
  const [kx, ky] = P(8, 0, BAL + 44);
  art.quad(ctx, [P(7.6, 0, BAL + 38), P(8.4, 0, BAL + 38), P(8.4, 0, BAL + 50), P(7.6, 0, BAL + 50)], '#ffffff', '#22252b', 1.2);
  ctx.fillStyle = '#22252b';
  ctx.fillRect(kx - 0.5, ky - 4, 1, 4);
  // ground floor: elevator doors, bulletin boards, "Student Union" lettering
  art.quad(ctx, [P(11, 0, 0), P(12.4, 0, 0), P(12.4, 0, 40), P(11, 0, 40)], '#b9c0c8', '#7b8896', 1.2);
  art.quad(ctx, [P(11.68, 0, 0), P(11.72, 0, 0), P(11.72, 0, 40), P(11.68, 0, 40)], '#7b8896');
  art.quad(ctx, [P(2.6, 0, 18), P(4.6, 0, 18), P(4.6, 0, 42), P(2.6, 0, 42)], '#2b2f38', '#111', 1);
  const notes = ['#fff1a6', '#ffd6e6', '#c9f0ff', '#d6ffc9', '#ffffff', '#ffe0b3'];
  notes.forEach((c, i) => {
    const x0 = 2.75 + (i % 3) * 0.6;
    const z0 = 21 + Math.floor(i / 3) * 10;
    art.quad(ctx, [P(x0, 0, z0), P(x0 + 0.45, 0, z0), P(x0 + 0.45, 0, z0 + 8), P(x0, 0, z0 + 8)], c);
  });
  ctx.save();
  const [lx, ly] = P(8, 0, 56);
  ctx.translate(lx, ly);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.fillStyle = '#c9a54a';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('STUDENT UNION', 0, 0);
  ctx.restore();
  // open staircase along the west wall (2025 renovation) — from the floor up to the balcony
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
  // front cut-away edge so players stay visible
  art.quad(ctx, [P(0, D), P(7, D), P(7, D, -10), P(0, D, -10)], '#8f8a84');
  art.quad(ctx, [P(9, D), P(W, D), P(W, D, -10), P(9, D, -10)], '#8f8a84');
  art.quad(ctx, [P(W, 0), P(W, D), P(W, D, -10), P(W, 0, -10)], '#77736d');
}
