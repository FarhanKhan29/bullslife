/**
 * Stylised versions of real UB North Campus buildings, drawn from reference
 * photos (Wikimedia Commons):
 *  - Student Union: cream precast concrete with a big round rotunda, tall
 *    dark-green window bays, recessed balconies, a glass dome ring and a
 *    glass skybridge on concrete brackets.
 *  - Capen Hall: dark brown brick, stepped/terraced mass, long ribbon
 *    windows, a windowless brick block on top, ground-floor colonnade.
 *  - Davis Hall: copper ribbed volume that leans out over a glass ground
 *    floor, diagonal "circuit board" stripes, next to a grey concrete wing
 *    with angled fins.
 * All art is original procedural drawing — no photos are embedded.
 */
import { shade } from '../character/avatarRenderer';
import { isoBox, projector, quad, type BuildingSpec, type Ctx } from './art';

type Proj = ReturnType<typeof projector>;
const SQ2 = Math.SQRT2;

/** Brick courses: thin horizontal lines across a face defined by a point mapper. */
function courses(ctx: Ctx, face: (u: number, v: number) => [number, number], u0: number, u1: number, v0: number, v1: number, step: number, color: string, lw = 0.5) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let v = v0 + step; v < v1; v += step) {
    ctx.moveTo(...face(u0, v));
    ctx.lineTo(...face(u1, v));
  }
  ctx.stroke();
}

function textOnSouth(ctx: Ctx, P: Proj, x: number, y: number, z: number, text: string, font: string, color: string) {
  ctx.save();
  const [tx, ty] = P(x, y, z);
  ctx.translate(tx, ty);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function textOnEast(ctx: Ctx, P: Proj, x: number, y: number, z: number, text: string, font: string, color: string) {
  ctx.save();
  const [tx, ty] = P(x, y, z);
  ctx.translate(tx, ty);
  ctx.transform(1, -0.5, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ------------------------------------------------------------------ cylinder
/**
 * Point on the front surface of a vertical cylinder (grid centre cx,cy, radius r).
 * `a` is the screen-ellipse angle: 0 = right, PI/2 = front, PI = left.
 * Grid south (+y) is a = 3PI/4, grid east (+x) is a = PI/4.
 */
function cylPoint(P: Proj, cx: number, cy: number, r: number, a: number, z: number): [number, number] {
  const [sx, sy] = P(cx, cy, 0);
  return [sx + Math.cos(a) * r * 32 * SQ2, sy + Math.sin(a) * r * 16 * SQ2 - z];
}

/** A patch on the cylinder surface between angles a0..a1 and heights z0..z1. */
function cylPatch(ctx: Ctx, P: Proj, cx: number, cy: number, r: number, a0: number, a1: number, z0: number, z1: number, fill: string | CanvasGradient, stroke?: string) {
  const n = 8;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const p = cylPoint(P, cx, cy, r, a0 + ((a1 - a0) * i) / n, z0);
    i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
  }
  for (let i = n; i >= 0; i--) ctx.lineTo(...cylPoint(P, cx, cy, r, a0 + ((a1 - a0) * i) / n, z1));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

function cylTop(ctx: Ctx, P: Proj, cx: number, cy: number, r: number, z: number, fill: string, stroke?: string) {
  const [sx, sy] = P(cx, cy, z);
  ctx.beginPath();
  ctx.ellipse(sx, sy, r * 32 * SQ2, r * 16 * SQ2, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ Student Union
export function studentUnion(): BuildingSpec {
  const W = 9;
  const D = 7;
  const cx = 5.6;
  const cy = 3.8;
  const R = 3.2;
  const H = 96;
  const cream = '#e9e2d3';
  const green = '#2f5d4a';
  return {
    w: W,
    d: D,
    maxH: 175,
    draw(ctx, P) {
      // back block (offices) — same precast panels
      isoBox(ctx, P, 0, 0, 6.6, 5.2, 0, 84, cream, { top: '#c9c4ba' });
      courses(ctx, (u, v) => P(6.6, u, v), 0, 5.2, 0, 84, 14, shade(cream, -0.12));
      // west wing (low) at the front-left
      isoBox(ctx, P, 0, 4.6, 2.8, 2.4, 0, 54, cream, { top: '#c9c4ba' });
      courses(ctx, (u, v) => P(u, 7, v), 0, 2.8, 0, 54, 13.5, shade(cream, -0.1));
      for (const x of [0.4, 1.6]) quad(ctx, [P(x, 7, 30), P(x + 0.8, 7, 30), P(x + 0.8, 7, 46), P(x, 7, 46)], '#4a6b5c', '#24392f', 0.7);
      // brick stair tower + glass skybridge on concrete brackets (to the Spine)
      isoBox(ctx, P, 7.6, 0.2, 1.4, 1.6, 0, 92, '#7a4434', { top: '#5c3428' });
      courses(ctx, (u, v) => P(9, u, v), 0.2, 1.8, 0, 92, 4, '#6a3a2c', 0.4);
      isoBox(ctx, P, 6.6, 0.55, 1.0, 0.9, 40, 22, '#3d6b62', { top: '#d9dfe2' });
      for (let i = 0; i < 4; i++) {
        const x = 6.6 + i * 0.25;
        quad(ctx, [P(x, 1.45, 43), P(x + 0.2, 1.45, 43), P(x + 0.2, 1.45, 60), P(x, 1.45, 60)], '#9fd0d6', '#2c4b46', 0.5);
      }
      for (const x of [6.8, 7.3]) quad(ctx, [P(x, 1.45, 40), P(x + 0.12, 1.45, 40), P(x + 0.12, 1.45, 30), P(x, 1.45, 34)], '#d8d2c6', '#9a958c', 0.5);

      // ---- the rotunda ----
      // soft shading gradient across the drum
      const [lx] = cylPoint(P, cx, cy, R, Math.PI, 0);
      const [rx] = cylPoint(P, cx, cy, R, 0, 0);
      const grad = ctx.createLinearGradient(lx, 0, rx, 0);
      grad.addColorStop(0, shade(cream, 0.08));
      grad.addColorStop(0.55, cream);
      grad.addColorStop(1, shade(cream, -0.2));
      cylPatch(ctx, P, cx, cy, R, 0, Math.PI, 0, H, grad, shade(cream, -0.45));
      // horizontal precast joints
      ctx.strokeStyle = shade(cream, -0.13);
      ctx.lineWidth = 0.5;
      for (let z = 16; z < H; z += 16) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const p = cylPoint(P, cx, cy, R, (Math.PI * i) / 24, z);
          i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
        }
        ctx.stroke();
      }
      // tall dark-green window bays (2 storeys) + recessed balconies above
      const bays = [0.38, 0.62, 0.86, 1.1, 1.34, 1.58, 1.82, 2.06, 2.62, 2.86];
      for (const a of bays) {
        const a0 = a - 0.085;
        const a1 = a + 0.085;
        const shadeAmt = Math.cos(a) * 0.5;
        const glass = shade('#3b5f5a', -0.1 - shadeAmt * 0.3);
        cylPatch(ctx, P, cx, cy, R, a0, a1, 4, 52, glass, '#1d332c');
        // mullions
        for (const t of [0.33, 0.66]) {
          const am = a0 + (a1 - a0) * t;
          ctx.strokeStyle = green;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(...cylPoint(P, cx, cy, R, am, 4));
          ctx.lineTo(...cylPoint(P, cx, cy, R, am, 52));
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(...cylPoint(P, cx, cy, R, a0, 28));
        ctx.lineTo(...cylPoint(P, cx, cy, R, a1, 28));
        ctx.stroke();
        // balcony opening + green railing
        cylPatch(ctx, P, cx, cy, R, a0 + 0.01, a1 - 0.01, 64, 82, shade('#2a2622', 0.1 - shadeAmt * 0.2));
        cylPatch(ctx, P, cx, cy, R, a0 + 0.01, a1 - 0.01, 64, 70, green, '#1d332c');
      }
      // main entrance (south): glass doors under a canopy
      const da = (Math.PI * 3) / 4;
      cylPatch(ctx, P, cx, cy, R, da - 0.2, da + 0.2, 0, 36, '#2e4a44', '#16241f');
      for (let i = 1; i < 6; i++) {
        const am = da - 0.2 + (0.4 * i) / 6;
        ctx.strokeStyle = '#9fc9c0';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(...cylPoint(P, cx, cy, R, am, 2));
        ctx.lineTo(...cylPoint(P, cx, cy, R, am, 34));
        ctx.stroke();
      }
      cylPatch(ctx, P, cx, cy, R + 0.35, da - 0.26, da + 0.26, 38, 42, '#f2efe8', '#9a958c');
      // warm light spill at the doors
      ctx.save();
      ctx.globalAlpha = 0.3;
      cylPatch(ctx, P, cx, cy, R + 0.5, da - 0.2, da + 0.2, 0, 2, '#ffe7a8');
      ctx.restore();
      // gold "Student Union" letters
      const [gx, gy] = cylPoint(P, cx, cy, R, 1.7, 60);
      ctx.save();
      ctx.translate(gx, gy);
      ctx.transform(1, -0.12, 0, 1, 0, 0);
      ctx.fillStyle = '#e8b730';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Student Union', 0, 0);
      ctx.restore();
      // roof ring (parapet) + glass dome
      cylTop(ctx, P, cx, cy, R, H, '#d8d2c6', shade(cream, -0.45));
      cylTop(ctx, P, cx, cy, R - 0.35, H, '#b8b2a6');
      const rd = R - 0.75;
      const [dx, dy] = P(cx, cy, H + 1);
      const drx = rd * 32 * SQ2;
      const dry = rd * 16 * SQ2;
      const dome = 42;
      const dg = ctx.createLinearGradient(dx - drx, dy - dome, dx + drx, dy);
      dg.addColorStop(0, '#f2faff');
      dg.addColorStop(0.5, '#a9d0e8');
      dg.addColorStop(1, '#5f93b8');
      ctx.beginPath();
      ctx.ellipse(dx, dy, drx, dry, 0, Math.PI, 0, true); // front half of the base
      ctx.ellipse(dx, dy, drx, dome + dry * 0.2, 0, 0, Math.PI, true); // dome silhouette
      ctx.closePath();
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = '#4f7f9f';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // dome ribs (meridians) + a ring
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 0.7;
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const bx = dx - drx + 2 * drx * t;
        const by = dy + Math.sin(Math.acos(1 - 2 * t)) * dry;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(dx + (bx - dx) * 0.9, dy - dome * 0.9, dx, dy - dome - dry * 0.2 + 1);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(dx, dy - dome * 0.55, drx * 0.78, dry * 0.7, 0, 0, Math.PI);
      ctx.stroke();
      // lantern on top
      ctx.fillStyle = '#d8d2c6';
      ctx.fillRect(dx - 5, dy - dome - dry * 0.2 - 6, 10, 6);
      // UB-blue fascia stripe (game readability)
      cylPatch(ctx, P, cx, cy, R, 0, Math.PI, H - 5, H - 2, '#005bbb');
    },
  };
}

// ------------------------------------------------------------------ Capen Hall
export function capenHall(): BuildingSpec {
  const W = 10;
  const D = 7;
  const brick = '#6b3a2c';
  const mortar = '#5a3024';
  const glass = '#2b2f36';
  return {
    w: W,
    d: D,
    maxH: 150,
    draw(ctx, P) {
      // recessed ground floor (dark glass) behind a brick colonnade
      isoBox(ctx, P, 0.6, 0.6, W - 1.2, D - 1.2, 0, 24, '#3a2a25', { outline: false });
      for (let x = 1; x < W - 1; x += 1.2) quad(ctx, [P(x, D - 0.6, 3), P(x + 0.9, D - 0.6, 3), P(x + 0.9, D - 0.6, 21), P(x, D - 0.6, 21)], '#4d6170', '#1f2830', 0.5);
      for (let y = 1; y < D - 1; y += 1.2) quad(ctx, [P(W - 0.6, y, 3), P(W - 0.6, y + 0.9, 3), P(W - 0.6, y + 0.9, 21), P(W - 0.6, y, 21)], '#3d4f5c', '#1f2830', 0.5);
      // pilotis (brick piers)
      for (let x = 0; x <= W - 0.5; x += 2) isoBox(ctx, P, x, D - 0.5, 0.5, 0.5, 0, 24, brick);
      for (let y = 0; y < D - 0.5; y += 2) isoBox(ctx, P, W - 0.5, y, 0.5, 0.5, 0, 24, brick);

      // tier 1: three brick storeys with continuous ribbon windows
      const ribbonsS = (x0: number, x1: number, y: number, zs: number[]) => {
        for (const z of zs) {
          quad(ctx, [P(x0 + 0.2, y, z), P(x1 - 0.2, y, z), P(x1 - 0.2, y, z + 9), P(x0 + 0.2, y, z + 9)], glass, '#15171b', 0.6);
          ctx.strokeStyle = '#8b96a3';
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          for (let u = x0 + 0.5; u < x1 - 0.2; u += 0.42) {
            ctx.moveTo(...P(u, y, z));
            ctx.lineTo(...P(u, y, z + 9));
          }
          ctx.stroke();
          ctx.save();
          ctx.globalAlpha = 0.22;
          quad(ctx, [P(x0 + 0.2, y, z + 6), P(x1 - 0.2, y, z + 6), P(x1 - 0.2, y, z + 9), P(x0 + 0.2, y, z + 9)], '#c9dceb');
          ctx.restore();
        }
      };
      const ribbonsE = (y0: number, y1: number, x: number, zs: number[]) => {
        for (const z of zs) {
          quad(ctx, [P(x, y0 + 0.2, z), P(x, y1 - 0.2, z), P(x, y1 - 0.2, z + 9), P(x, y0 + 0.2, z + 9)], '#23262c', '#15171b', 0.6);
          ctx.strokeStyle = '#6f7a86';
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          for (let u = y0 + 0.5; u < y1 - 0.2; u += 0.42) {
            ctx.moveTo(...P(x, u, z));
            ctx.lineTo(...P(x, u, z + 9));
          }
          ctx.stroke();
        }
      };
      isoBox(ctx, P, 0, 0, W, D, 24, 54, brick, { top: '#8f8a84' });
      courses(ctx, (u, v) => P(u, D, v), 0, W, 24, 78, 3, mortar, 0.35);
      courses(ctx, (u, v) => P(W, u, v), 0, D, 24, 78, 3, shade(mortar, -0.1), 0.35);
      ribbonsS(0, W, D, [30, 48, 66]);
      ribbonsE(0, D, W, [30, 48, 66]);

      // tier 2: set back, one more storey
      isoBox(ctx, P, 0.6, 0.4, W - 1.2, D - 1.4, 78, 22, brick, { top: '#8f8a84' });
      courses(ctx, (u, v) => P(u, D - 1, v), 0.6, W - 0.6, 78, 100, 3, mortar, 0.35);
      ribbonsS(0.6, W - 0.6, D - 1, [84]);
      ribbonsE(0.4, D - 1, W - 0.6, [84]);
      // rooftop mechanical boxes
      isoBox(ctx, P, 1.2, 0.8, 1.2, 0.8, 100, 6, '#9aa3ad');
      isoBox(ctx, P, 7.6, 0.8, 1.2, 0.8, 100, 6, '#9aa3ad');

      // tier 3: tall windowless brick block in the middle (library stacks)
      isoBox(ctx, P, 3, 0.8, 4, 3.4, 100, 40, brick, { top: '#7d7872' });
      courses(ctx, (u, v) => P(u, 4.2, v), 3, 7, 100, 140, 3, mortar, 0.35);
      courses(ctx, (u, v) => P(7, u, v), 0.8, 4.2, 100, 140, 3, shade(mortar, -0.1), 0.35);

      // projecting central brick pier on the south face
      isoBox(ctx, P, 4.3, D - 0.2, 1.4, 0.5, 0, 100, shade(brick, 0.05));
      courses(ctx, (u, v) => P(u, D + 0.3, v), 4.3, 5.7, 24, 100, 3, mortar, 0.35);
      // entrance + small blue name sign
      quad(ctx, [P(3.4, D - 0.6, 0), P(4.2, D - 0.6, 0), P(4.2, D - 0.6, 20), P(3.4, D - 0.6, 20)], '#7fa9c6', '#1f2830', 0.8);
      quad(ctx, [P(4.45, D + 0.3, 30), P(5.55, D + 0.3, 30), P(5.55, D + 0.3, 37), P(4.45, D + 0.3, 37)], '#1f5fbf', '#0b2f5a', 0.6);
      textOnSouth(ctx, P, 5, D + 0.3, 33.5, 'Capen Hall', 'bold 5px system-ui, sans-serif', '#ffffff');
    },
  };
}

// ------------------------------------------------------------------ Davis Hall
export function davisHall(): BuildingSpec {
  const W = 9;
  const D = 8;
  const concrete = '#d2cdc2';
  const copper = '#b8784c';
  return {
    w: W,
    d: D,
    maxH: 150,
    draw(ctx, P) {
      // grey concrete wing at the back (Bell/Furnas style banding)
      isoBox(ctx, P, 0, 0, W, 3.4, 0, 74, concrete, { top: '#b9b4aa' });
      courses(ctx, (u, v) => P(W, u, v), 0, 3.4, 0, 74, 9, shade(concrete, -0.18), 0.6);
      for (let y = 0.4; y < 3; y += 1.1) quad(ctx, [P(W, y, 40), P(W, y + 0.7, 40), P(W, y + 0.7, 52), P(W, y, 52)], '#5e6670', '#3b4148', 0.6);

      // right concrete wing with angled buttress fins (east side)
      isoBox(ctx, P, 5.8, 3.4, 3.2, 4.6, 0, 58, concrete, { top: '#b9b4aa' });
      courses(ctx, (u, v) => P(u, D, v), 5.8, W, 0, 58, 9, shade(concrete, -0.15), 0.6);
      for (let y = 3.6; y < D; y += 0.75) {
        quad(ctx, [P(W, y, 58), P(W, y + 0.18, 58), P(W + 0.7, y + 0.18, 0), P(W + 0.7, y, 0)], shade(concrete, -0.06), shade(concrete, -0.4), 0.6);
      }
      quad(ctx, [P(6.2, D, 30), P(8.6, D, 30), P(8.6, D, 40), P(6.2, D, 40)], '#5e6670', '#3b4148', 0.6);
      textOnSouth(ctx, P, 7.4, D, 18, 'Barbara and Jack', '4.5px Georgia, serif', '#4b4f55');
      textOnSouth(ctx, P, 7.4, D, 12, 'Davis Hall', 'bold 6.5px Georgia, serif', '#3b3f45');

      // glass ground floor under the copper volume
      isoBox(ctx, P, 0, 3.4, 5.8, 4.2, 0, 26, '#3f6f8f', { top: '#3f6f8f' });
      for (let x = 0.4; x < 5.8; x += 0.5) quad(ctx, [P(x, 7.6, 0), P(x + 0.04, 7.6, 0), P(x + 0.04, 7.6, 26), P(x, 7.6, 26)], '#cfe3ef');
      quad(ctx, [P(2.2, 7.6, 0), P(3.2, 7.6, 0), P(3.2, 7.6, 20), P(2.2, 7.6, 20)], '#24465c', '#cfe3ef', 0.6);

      // the copper volume, leaning out over the entrance
      const z0 = 26;
      const z1 = 122;
      const yAt = (v: number) => 7.6 + ((v - z0) / (z1 - z0)) * 0.9; // south face leans outward
      const S = (u: number, v: number): [number, number] => P(u, yAt(v), v);
      const E = (u: number, v: number): [number, number] => P(5.8, 3.4 + u * (yAt(v) - 3.4), v); // u 0..1 along east face
      // east face
      ctx.beginPath();
      ctx.moveTo(...E(0, z0));
      ctx.lineTo(...E(1, z0));
      ctx.lineTo(...E(1, z1));
      ctx.lineTo(...E(0, z1));
      ctx.closePath();
      ctx.fillStyle = shade(copper, -0.18);
      ctx.fill();
      // south face
      ctx.beginPath();
      ctx.moveTo(...S(0, z0));
      ctx.lineTo(...S(5.8, z0));
      ctx.lineTo(...S(5.8, z1));
      ctx.lineTo(...S(0, z1));
      ctx.closePath();
      ctx.fillStyle = copper;
      ctx.fill();
      // ribs
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = shade(copper, -0.22);
      ctx.beginPath();
      for (let v = z0 + 2.5; v < z1; v += 2.5) {
        ctx.moveTo(...S(0, v));
        ctx.lineTo(...S(5.8, v));
        ctx.moveTo(...E(0, v));
        ctx.lineTo(...E(1, v));
      }
      ctx.stroke();
      // diagonal "circuit board" bands
      const band = (ua: number, va: number, ub: number, vb: number, t: number) => {
        ctx.beginPath();
        ctx.moveTo(...S(ua, va));
        ctx.lineTo(...S(ub, vb));
        ctx.lineTo(...S(ub, vb + t));
        ctx.lineTo(...S(ua, va + t));
        ctx.closePath();
        ctx.fillStyle = '#6e4632';
        ctx.fill();
      };
      band(0, 70, 5.8, 98, 4);
      band(0, 44, 3.2, 58, 3.5);
      band(2.4, 104, 5.8, 116, 3);
      // ribbon windows
      for (const v of [52, 80]) {
        ctx.beginPath();
        ctx.moveTo(...S(1.4, v));
        ctx.lineTo(...S(5.6, v));
        ctx.lineTo(...S(5.6, v + 8));
        ctx.lineTo(...S(1.4, v + 8));
        ctx.closePath();
        ctx.fillStyle = '#a9c7d6';
        ctx.fill();
        ctx.strokeStyle = '#4a3326';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.beginPath();
        for (let u = 1.8; u < 5.6; u += 0.45) {
          ctx.moveTo(...S(u, v));
          ctx.lineTo(...S(u, v + 8));
        }
        ctx.stroke();
      }
      // dark louver band near the top of the east face
      ctx.beginPath();
      ctx.moveTo(...E(0.15, 100));
      ctx.lineTo(...E(0.95, 100));
      ctx.lineTo(...E(0.95, 112));
      ctx.lineTo(...E(0.15, 112));
      ctx.closePath();
      ctx.fillStyle = '#4a3326';
      ctx.fill();
      // top
      ctx.beginPath();
      ctx.moveTo(...P(0, 3.4, z1));
      ctx.lineTo(...P(5.8, 3.4, z1));
      ctx.lineTo(...P(5.8, yAt(z1), z1));
      ctx.lineTo(...P(0, yAt(z1), z1));
      ctx.closePath();
      ctx.fillStyle = '#8c6a52';
      ctx.fill();
      // outlines
      ctx.strokeStyle = shade(copper, -0.5);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(...S(0, z0));
      ctx.lineTo(...S(5.8, z0));
      ctx.lineTo(...S(5.8, z1));
      ctx.lineTo(...S(0, z1));
      ctx.closePath();
      ctx.moveTo(...E(0, z0));
      ctx.lineTo(...E(0, z1));
      ctx.stroke();
      // tiny green roof
      quad(ctx, [P(6.2, 3.8, 58), P(8.6, 3.8, 58), P(8.6, 7.6, 58), P(6.2, 7.6, 58)], '#7fae5e', '#5a8a44', 0.6);
      textOnEast(ctx, P, W, 1.7, 62, 'ENGINEERING', 'bold 5px system-ui, sans-serif', '#5e6670');
    },
  };
}
