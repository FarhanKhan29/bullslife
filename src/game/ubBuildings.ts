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
      const da = Math.acos((5.8 - cx) / R);
      cylPatch(ctx, P, cx, cy, R, da - 0.2, da + 0.2, 0, 44, '#2e4a44', '#16241f');
      for (let i = 1; i < 6; i++) {
        const am = da - 0.2 + (0.4 * i) / 6;
        ctx.strokeStyle = '#9fc9c0';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(...cylPoint(P, cx, cy, R, am, 2));
        ctx.lineTo(...cylPoint(P, cx, cy, R, am, 42));
        ctx.stroke();
      }
      cylPatch(ctx, P, cx, cy, R + 0.35, da - 0.26, da + 0.26, 46, 50, '#f2efe8', '#9a958c');
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
      drawDoor(ctx, P, 's', 0, D, 3.15, 'Capen Hall');
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

// ================================================================== generic campus buildings
export type Mat = 'brick' | 'darkbrick' | 'redbrick' | 'concrete' | 'white' | 'tan';
const MAT: Record<Mat, { c: string; line: string; roof: string; courses: number }> = {
  brick: { c: '#7a4434', line: '#663729', roof: '#8f8a84', courses: 3 },
  darkbrick: { c: '#5e3226', line: '#4d281e', roof: '#7d7872', courses: 3 },
  redbrick: { c: '#9a4a36', line: '#82392a', roof: '#8f8a84', courses: 3 },
  concrete: { c: '#cfc8bb', line: '#b8b1a4', roof: '#a9a39a', courses: 12 },
  white: { c: '#e9e6df', line: '#d2cec5', roof: '#b9b5ad', courses: 14 },
  tan: { c: '#c9a882', line: '#b5946f', roof: '#9a958c', courses: 4 },
};

export type WinStyle = 'ribbon' | 'punched' | 'slit' | 'curtain' | 'bands' | 'none';
export interface Tier {
  x: number;
  y: number;
  w: number;
  d: number;
  z?: number;
  h: number;
  win: WinStyle;
  floorH?: number;
  mat?: Mat;
}

type Face = (u: number, v: number) => [number, number];

/** Windows on one face. u runs along the face (tiles), v is height (px). */
function faceWindows(ctx: Ctx, F: Face, len: number, z0: number, z1: number, style: WinStyle, floorH: number, lit: boolean) {
  const glass = lit ? '#33404d' : '#26303a';
  const frame = '#15191e';
  if (style === 'none') return;
  if (style === 'curtain') {
    const g = ctx.createLinearGradient(...F(0, z0), ...F(len, z1));
    g.addColorStop(0, lit ? '#a6d3ef' : '#6fa3c6');
    g.addColorStop(1, lit ? '#5c97c2' : '#3e7aa8');
    poly(ctx, [F(0.15, z0 + 4), F(len - 0.15, z0 + 4), F(len - 0.15, z1 - 4), F(0.15, z1 - 4)], g);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let u = 0.15; u < len; u += 0.5) {
      ctx.moveTo(...F(u, z0 + 4));
      ctx.lineTo(...F(u, z1 - 4));
    }
    for (let v = z0 + 4; v < z1; v += floorH / 2) {
      ctx.moveTo(...F(0.15, v));
      ctx.lineTo(...F(len - 0.15, v));
    }
    ctx.stroke();
    return;
  }
  for (let v = z0; v + floorH <= z1 + 0.1; v += floorH) {
    if (style === 'ribbon' || style === 'bands') {
      const a = v + floorH * (style === 'bands' ? 0.25 : 0.32);
      const b = v + floorH * 0.82;
      poly(ctx, [F(0.25, a), F(len - 0.25, a), F(len - 0.25, b), F(0.25, b)], glass, frame);
      ctx.strokeStyle = '#7f8b98';
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      for (let u = 0.6; u < len - 0.25; u += 0.45) {
        ctx.moveTo(...F(u, a));
        ctx.lineTo(...F(u, b));
      }
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.18;
      poly(ctx, [F(0.25, b - 3), F(len - 0.25, b - 3), F(len - 0.25, b), F(0.25, b)], '#d6e6f2');
      ctx.restore();
    } else if (style === 'punched') {
      for (let u = 0.35; u + 0.45 < len; u += 0.8) {
        const a = v + floorH * 0.3;
        const b = v + floorH * 0.8;
        poly(ctx, [F(u, a), F(u + 0.45, a), F(u + 0.45, b), F(u, b)], glass, frame);
        ctx.save();
        ctx.globalAlpha = 0.3;
        poly(ctx, [F(u + 0.05, b - 2), F(u + 0.2, b - 2), F(u + 0.12, a + 2), F(u + 0.05, a + 2)], '#ffffff');
        ctx.restore();
      }
    } else if (style === 'slit') {
      for (let u = 0.4; u + 0.18 < len; u += 0.6) {
        poly(ctx, [F(u, v + 4), F(u + 0.16, v + 4), F(u + 0.16, v + floorH - 2), F(u, v + floorH - 2)], glass, frame);
      }
    }
  }
}

function poly(ctx: Ctx, pts: [number, number][], fill: string | CanvasGradient, stroke?: string, lw = 0.7) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Draw one box tier with material texture and windows on its two visible faces. */
export function drawTier(ctx: Ctx, P: Proj, t: Tier, mat: Mat) {
  const m = MAT[t.mat ?? mat];
  const z = t.z ?? 0;
  isoBox(ctx, P, t.x, t.y, t.w, t.d, z, t.h, m.c, { top: m.roof });
  const S: Face = (u, v) => P(t.x + u, t.y + t.d, v);
  const E: Face = (u, v) => P(t.x + t.w, t.y + u, v);
  courses(ctx, S, 0, t.w, z, z + t.h, m.courses, m.line, 0.35);
  courses(ctx, E, 0, t.d, z, z + t.h, m.courses, shade(m.line, -0.08), 0.35);
  const fh = t.floorH ?? 18;
  faceWindows(ctx, S, t.w, z, z + t.h - 4, t.win, fh, true);
  faceWindows(ctx, E, t.d, z, z + t.h - 4, t.win, fh, false);
  if (t.win === 'bands') {
    // concrete spandrel lines between window bands
    ctx.strokeStyle = shade(m.c, 0.12);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let v = z + fh; v < z + t.h; v += fh) {
      ctx.moveTo(...S(0, v));
      ctx.lineTo(...S(t.w, v));
      ctx.moveTo(...E(0, v));
      ctx.lineTo(...E(t.d, v));
    }
    ctx.stroke();
  }
}

/** Glass entrance with a canopy and a small name plate. */
export function drawDoor(ctx: Ctx, P: Proj, side: 's' | 'e', x: number, y: number, u: number, name?: string, color = '#1f5fbf') {
  const F: Face = side === 's' ? (a, v) => P(x + a, y, v) : (a, v) => P(x, y + a, v);
  const w = 1.4;
  const height = 44;
  poly(ctx, [F(u, 0), F(u + w, 0), F(u + w, height), F(u, height)], '#2c3e50', '#111', 0.8);
  poly(ctx, [F(u + 0.08, 0), F(u + w / 2 - 0.03, 0), F(u + w / 2 - 0.03, height - 4), F(u + 0.08, height - 4)], '#9fd3f0', '#35506a', 0.6);
  poly(ctx, [F(u + w / 2 + 0.03, 0), F(u + w - 0.08, 0), F(u + w - 0.08, height - 4), F(u + w / 2 + 0.03, height - 4)], '#8cc6e8', '#35506a', 0.6);
  // canopy
  const out = side === 's' ? (a: number, v: number) => P(x + a, y + 0.6, v) : (a: number, v: number) => P(x + 0.6, y + a, v);
  poly(ctx, [F(u - 0.2, height + 3), F(u + w + 0.2, height + 3), out(u + w + 0.2, height + 1), out(u - 0.2, height + 1)], '#e8e4dc', '#8f8a84', 0.7);
  // light spill
  ctx.save();
  ctx.globalAlpha = 0.3;
  poly(ctx, [F(u, 0), F(u + w, 0), out(u + w + 0.3, 0), out(u - 0.3, 0)], '#ffe7a8');
  ctx.restore();
  if (name) {
    poly(ctx, [F(u - 0.3, height + 7), F(u + w + 0.3, height + 7), F(u + w + 0.3, height + 15), F(u - 0.3, height + 15)], color, '#0b2f5a', 0.6);
    ctx.save();
    const [tx, ty] = F(u + w / 2, height + 11);
    ctx.translate(tx, ty);
    ctx.transform(1, side === 's' ? 0.5 : -0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }
}

export interface SlabSpec {
  w: number;
  d: number;
  mat: Mat;
  tiers: Tier[];
  door: { side: 's' | 'e'; u: number };
  name: string;
  extra?: (ctx: Ctx, P: Proj) => void;
}

export function slab(spec: SlabSpec): BuildingSpec {
  const maxH = Math.max(...spec.tiers.map((t) => (t.z ?? 0) + t.h)) + 20;
  return {
    w: spec.w,
    d: spec.d,
    maxH,
    draw(ctx, P) {
      [...spec.tiers].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.x + a.y - (b.x + b.y)).forEach((t) => drawTier(ctx, P, t, spec.mat));
      // roof clutter
      const top = spec.tiers.reduce((a, b) => ((a.z ?? 0) + a.h >= (b.z ?? 0) + b.h ? a : b));
      isoBox(ctx, P, top.x + 0.5, top.y + 0.5, 0.9, 0.7, (top.z ?? 0) + top.h, 7, '#a5adb6');
      isoBox(ctx, P, top.x + top.w - 1.5, top.y + 0.6, 0.7, 0.6, (top.z ?? 0) + top.h, 5, '#b9c0c8');
      spec.extra?.(ctx, P);
      const d = spec.door;
      if (d.side === 's') drawDoor(ctx, P, 's', 0, spec.d, d.u, spec.name);
      else drawDoor(ctx, P, 'e', spec.w, 0, d.u, spec.name);
    },
  };
}

// ------------------------------------------------------------------ Academic Spine
export const baldyHall = () =>
  slab({ w: 8, d: 7, mat: 'darkbrick', name: 'Baldy Hall', door: { side: 's', u: 3.3 }, tiers: [{ x: 0, y: 0, w: 8, d: 7, h: 108, win: 'ribbon', floorH: 18 }] });

export const clemensHall = () =>
  slab({
    w: 7,
    d: 8,
    mat: 'brick',
    name: 'Clemens Hall',
    door: { side: 's', u: 2.8 },
    tiers: [
      { x: 0, y: 0, w: 7, d: 8, h: 36, win: 'punched', floorH: 18 },
      { x: 0.7, y: 0.7, w: 5.6, d: 5.8, z: 36, h: 126, win: 'ribbon', floorH: 18 },
    ],
    extra(ctx, P) {
      // vertical brick piers on the tower
      for (let u = 0.7; u <= 6.3; u += 1.4) isoBox(ctx, P, u - 0.1, 6.4, 0.25, 0.15, 36, 126, '#83493a');
    },
  });

export const nortonHall = () =>
  slab({
    w: 7,
    d: 6,
    mat: 'brick',
    name: 'Norton Hall',
    door: { side: 's', u: 2.8 },
    tiers: [
      { x: 0, y: 0, w: 7, d: 3, h: 84, win: 'none' }, // lecture hall block (windowless)
      { x: 0, y: 3, w: 7, d: 3, h: 54, win: 'punched', floorH: 18 },
    ],
  });

export const talbertHall = () =>
  slab({
    w: 7,
    d: 7,
    mat: 'brick',
    name: 'Talbert Hall',
    door: { side: 's', u: 2.8 },
    tiers: [
      { x: 0, y: 0, w: 7, d: 7, h: 72, win: 'ribbon', floorH: 18 },
      { x: 0.8, y: 0.6, w: 5.4, d: 5.4, z: 72, h: 18, win: 'ribbon', floorH: 18 },
    ],
  });

export const lockwoodLibrary = () =>
  slab({
    w: 9,
    d: 8,
    mat: 'darkbrick',
    name: 'Lockwood Library',
    door: { side: 'e', u: 3.3 },
    tiers: [
      { x: 0, y: 0, w: 9, d: 8, h: 26, win: 'curtain', floorH: 26, mat: 'concrete' },
      { x: 0, y: 0, w: 9, d: 8, z: 26, h: 96, win: 'slit', floorH: 24 },
    ],
  });

// ------------------------------------------------------------------ Engineering
export const bellHall = () =>
  slab({ w: 8, d: 7, mat: 'concrete', name: 'Bell Hall', door: { side: 's', u: 3.3 }, tiers: [{ x: 0, y: 0, w: 8, d: 7, h: 80, win: 'bands', floorH: 20 }] });

export const furnasHall = () =>
  slab({
    w: 7,
    d: 6,
    mat: 'brick',
    name: 'Furnas Hall',
    door: { side: 's', u: 2.8 },
    tiers: [{ x: 0, y: 0, w: 7, d: 6, h: 76, win: 'punched', floorH: 19 }],
    extra(ctx, P) {
      for (const v of [19, 38, 57]) poly(ctx, [P(0, 6, v), P(7, 6, v), P(7, 6, v + 2.5), P(0, 6, v + 2.5)], '#d8d0c2');
    },
  });

export const ketterHall = () =>
  slab({
    w: 7,
    d: 7,
    mat: 'concrete',
    name: 'Ketter Hall',
    door: { side: 'e', u: 4.2 },
    tiers: [
      { x: 0, y: 0, w: 4, d: 7, h: 112, win: 'none', mat: 'tan' }, // high-bay structures lab
      { x: 4, y: 0, w: 3, d: 7, h: 72, win: 'bands', floorH: 18 },
    ],
    extra(ctx, P) {
      // corrugated metal ribs on the lab box
      ctx.strokeStyle = '#a88e70';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let u = 0.2; u < 4; u += 0.18) {
        ctx.moveTo(...P(u, 7, 0));
        ctx.lineTo(...P(u, 7, 112));
      }
      ctx.stroke();
      poly(ctx, [P(0.6, 7, 70), P(3.4, 7, 70), P(3.4, 7, 82), P(0.6, 7, 82)], '#2b2f38');
      textOnSouth(ctx, P, 2, 7, 76, 'STRUCTURES LAB', 'bold 6px system-ui, sans-serif', '#ffd75e');
    },
  });

// ------------------------------------------------------------------ Residence halls
export function ellicottComplex(): BuildingSpec {
  // Franzen's "hill town": clusters of stepped brick towers with angled skylight roofs
  const W = 16;
  const D = 14;
  const blocks: Tier[] = [];
  const hs = [
    [70, 110, 90, 130],
    [90, 140, 120, 100],
    [60, 100, 130, 80],
    [50, 80, 60, 70],
  ];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (i === 3 && j === 1) continue; // courtyard opening near the door
    blocks.push({ x: j * 4 + 0.2, y: i * 3.5 + 0.2, w: 3.6, d: 3.1, h: hs[i][j], win: 'punched', floorH: 17, mat: 'redbrick' });
  }
  return {
    w: W,
    d: D,
    maxH: 180,
    draw(ctx, P) {
      blocks.sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((t) => {
        drawTier(ctx, P, t, 'redbrick');
        // sloped skylight cap
        const z = t.h;
        poly(ctx, [P(t.x, t.y, z), P(t.x + t.w, t.y, z), P(t.x + t.w, t.y + t.d * 0.5, z + 14), P(t.x, t.y + t.d * 0.5, z + 14)], '#8fb8d0', '#4f6f86');
        poly(ctx, [P(t.x, t.y + t.d * 0.5, z + 14), P(t.x + t.w, t.y + t.d * 0.5, z + 14), P(t.x + t.w, t.y + t.d, z), P(t.x, t.y + t.d, z)], '#a87060', '#6b3b2c');
      });
      // low glass link at the entrance courtyard
      isoBox(ctx, P, 4.2, 10.7, 3.6, 3.3, 0, 28, '#7fb3d4', { top: '#cfe3ef' });
      drawDoor(ctx, P, 's', 0, D, 5.3, 'Ellicott Complex', '#9a4a36');
    },
  };
}

export function governorsComplex(): BuildingSpec {
  // four small brick residence halls around a courtyard
  return {
    w: 8,
    d: 8,
    maxH: 90,
    draw(ctx, P) {
      quad(ctx, [P(2.9, 2.9), P(5.1, 2.9), P(5.1, 5.1), P(2.9, 5.1)], '#7fbf69');
      const halls: [number, number][] = [
        [0, 0],
        [5.1, 0],
        [0, 5.1],
        [5.1, 5.1],
      ];
      for (const [x, y] of halls) drawTier(ctx, P, { x, y, w: 2.9, d: 2.9, h: 62, win: 'punched', floorH: 15 }, 'brick');
      // little courtyard tree
      const [tx, ty] = P(4, 4, 0);
      ctx.fillStyle = '#6b4a31';
      ctx.fillRect(tx - 1.5, ty - 18, 3, 18);
      for (const [dx, dy, r] of [
        [0, -26, 10],
        [-6, -22, 7],
        [6, -21, 7],
      ]) {
        ctx.beginPath();
        ctx.arc(tx + dx, ty + dy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#e8913c';
        ctx.fill();
      }
      drawDoor(ctx, P, 'e', 8, 0, 5.8, 'Governors', '#7a4434');
    },
  };
}

export function greinerHall(): BuildingSpec {
  return {
    w: 8,
    d: 7,
    maxH: 120,
    draw(ctx, P) {
      drawTier(ctx, P, { x: 0, y: 0, w: 8, d: 3, h: 96, win: 'punched', floorH: 19 }, 'redbrick');
      drawTier(ctx, P, { x: 0, y: 3, w: 3.2, d: 4, h: 96, win: 'punched', floorH: 19 }, 'redbrick');
      // white panel frames + glass corner (modern residence hall)
      isoBox(ctx, P, 3.2, 3, 4.8, 4, 0, 40, '#e9e6df', { top: '#b9b5ad' });
      faceWindows(ctx, (u, v) => P(3.2 + u, 7, v), 4.8, 0, 40, 'curtain', 20, true);
      faceWindows(ctx, (u, v) => P(8, 3 + u, v), 4, 0, 40, 'curtain', 20, false);
      for (let v = 19; v < 96; v += 19) poly(ctx, [P(0, 7, v), P(3.2, 7, v), P(3.2, 7, v + 2), P(0, 7, v + 2)], '#f1eee8');
      drawDoor(ctx, P, 's', 3.2, 7, 1.6, 'Greiner Hall', '#9a4a36');
    },
  };
}

// ------------------------------------------------------------------ Sports, arts, food
export function alumniArena(): BuildingSpec {
  const W = 12;
  const D = 10;
  return {
    w: W,
    d: D,
    maxH: 120,
    draw(ctx, P) {
      drawTier(ctx, P, { x: 0, y: 0, w: W, d: D, h: 70, win: 'none', mat: 'tan' }, 'tan');
      // UB blue band + lettering
      poly(ctx, [P(0, D, 46), P(W, D, 46), P(W, D, 58), P(0, D, 58)], '#005bbb');
      poly(ctx, [P(W, 0, 46), P(W, D, 46), P(W, D, 58), P(W, 0, 58)], '#00479a');
      textOnSouth(ctx, P, W / 2, D, 52, 'ALUMNI ARENA', 'bold 8px system-ui, sans-serif', '#ffffff');
      // barrel-vault roof (along x)
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * Math.PI;
        const a1 = ((i + 1) / steps) * Math.PI;
        const y0 = (D / 2) * (1 - Math.cos(a0));
        const y1 = (D / 2) * (1 - Math.cos(a1));
        const z0 = 70 + Math.sin(a0) * 34;
        const z1 = 70 + Math.sin(a1) * 34;
        const light = i < steps / 2 ? 0.1 : -0.05;
        poly(ctx, [P(0, y0, z0), P(W, y0, z0), P(W, y1, z1), P(0, y1, z1)], shade('#b9c4cf', light), '#8a96a3', 0.4);
      }
      // gable ends on the east
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const p = P(W, (D / 2) * (1 - Math.cos(a)), 70 + Math.sin(a) * 34);
        i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p);
      }
      ctx.closePath();
      ctx.fillStyle = '#a9b4bf';
      ctx.fill();
      faceWindows(ctx, (u, v) => P(W, u, v), D, 0, 44, 'curtain', 22, false);
      drawDoor(ctx, P, 'e', W, 0, 4.3, 'Alumni Arena');
    },
  };
}

export function ubStadium(): BuildingSpec {
  const W = 16;
  const D = 12;
  return {
    w: W,
    d: D,
    maxH: 120,
    draw(ctx, P) {
      // field
      quad(ctx, [P(2.6, 2.6), P(W - 0.6, 2.6), P(W - 0.6, D - 0.6), P(2.6, D - 0.6)], '#4f9a4a', '#3d7a3a', 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 4; x < W - 1; x += 1.2) {
        ctx.moveTo(...P(x, 3));
        ctx.lineTo(...P(x, D - 1));
      }
      ctx.stroke();
      quad(ctx, [P(3, 3), P(4, 3), P(4, D - 1), P(3, D - 1)], '#005bbb');
      quad(ctx, [P(W - 2, 3), P(W - 1, 3), P(W - 1, D - 1), P(W - 2, D - 1)], '#005bbb');
      // stands: north (back) and west (back), stepped with blue seats
      for (let i = 0; i < 6; i++) {
        isoBox(ctx, P, 2.4, 0.2 + i * 0.4, W - 2.4, 0.4, 0, 60 - i * 10, i % 2 ? '#c9c4ba' : '#005bbb', { top: i % 2 ? '#d9d4ca' : '#1f6cc6' });
        isoBox(ctx, P, 0.2 + i * 0.4, 2.4, 0.4, D - 2.4, 0, 60 - i * 10, i % 2 ? '#c9c4ba' : '#005bbb', { top: i % 2 ? '#d9d4ca' : '#1f6cc6' });
      }
      // press box
      isoBox(ctx, P, 6, 0, 5, 1.2, 60, 22, '#e9e6df');
      poly(ctx, [P(6.2, 1.2, 66), P(10.8, 1.2, 66), P(10.8, 1.2, 78), P(6.2, 1.2, 78)], '#5c97c2');
      // light towers
      for (const [x, y] of [
        [1, 1],
        [W - 0.5, 0.6],
        [0.6, D - 0.5],
      ]) {
        isoBox(ctx, P, x - 0.1, y - 0.1, 0.2, 0.2, 0, 110, '#7b8896');
        isoBox(ctx, P, x - 0.5, y - 0.2, 1, 0.3, 110, 10, '#f4f4f4');
      }
      // front fence + gate
      for (let x = 2.6; x < W; x += 0.3) poly(ctx, [P(x, D, 0), P(x + 0.04, D, 0), P(x + 0.04, D, 10), P(x, D, 10)], '#5e6670');
      poly(ctx, [P(2.6, D, 10), P(W, D, 10), P(W, D, 11), P(2.6, D, 11)], '#5e6670');
      isoBox(ctx, P, W - 0.4, 4.4, 0.4, 3, 0, 32, '#c9c4ba');
      drawDoor(ctx, P, 'e', W, 0, 5.2, 'UB Stadium');
    },
  };
}

export function centerForTheArts(): BuildingSpec {
  const W = 10;
  const D = 7;
  return {
    w: W,
    d: D,
    maxH: 110,
    draw(ctx, P) {
      drawTier(ctx, P, { x: 0, y: 0, w: W, d: 5, h: 84, win: 'none', mat: 'white' }, 'white');
      drawTier(ctx, P, { x: 6, y: 5, w: 4, d: 2, h: 60, win: 'none', mat: 'white' }, 'white');
      // big angled glass atrium wedge on the front-left
      const z1 = 84;
      poly(ctx, [P(0, 5, 0), P(6, 5, 0), P(6, 7, 0), P(0, 7, 0)], '#3e5f78');
      const g = ctx.createLinearGradient(...P(0, 7, 0), ...P(6, 5, z1));
      g.addColorStop(0, '#bfe2f5');
      g.addColorStop(1, '#5c97c2');
      poly(ctx, [P(0, 7, 0), P(6, 7, 0), P(6, 5, z1), P(0, 5, z1)], g, '#4f7f9f', 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let u = 0.6; u < 6; u += 0.6) {
        ctx.moveTo(...P(u, 7, 0));
        ctx.lineTo(...P(u, 5, z1));
      }
      for (let t = 0.2; t < 1; t += 0.2) {
        ctx.moveTo(...P(0, 7 - 2 * t, z1 * t));
        ctx.lineTo(...P(6, 7 - 2 * t, z1 * t));
      }
      ctx.stroke();
      poly(ctx, [P(6, 5, 0), P(6, 7, 0), P(6, 5, z1)], '#7fb3d4', '#4f7f9f', 0.8);
      textOnSouth(ctx, P, 8, 7, 40, 'CENTER FOR', 'bold 6px system-ui, sans-serif', '#3b3f45');
      textOnSouth(ctx, P, 8, 7, 32, 'THE ARTS', 'bold 6px system-ui, sans-serif', '#3b3f45');
      drawDoor(ctx, P, 's', 0, 7, 2.3);
    },
  };
}

export function theCommons(): BuildingSpec {
  const W = 8;
  const D = 6;
  return {
    w: W,
    d: D,
    maxH: 70,
    draw(ctx, P) {
      drawTier(ctx, P, { x: 0, y: 0, w: W, d: D, h: 46, win: 'punched', floorH: 23 }, 'brick');
      // glass storefronts with colourful awnings
      const colors = ['#d94b4b', '#f2a93b', '#3fae6b', '#005bbb'];
      for (let i = 0; i < 4; i++) {
        const u = 0.3 + i * 1.95;
        poly(ctx, [P(u, D, 0), P(u + 1.6, D, 0), P(u + 1.6, D, 20), P(u, D, 20)], '#8cc6e8', '#35506a', 0.7);
        poly(ctx, [P(u - 0.1, D, 22), P(u + 1.7, D, 22), P(u + 1.7, D + 0.5, 18), P(u - 0.1, D + 0.5, 18)], colors[i], shade(colors[i], -0.4), 0.6);
      }
      textOnSouth(ctx, P, W / 2, D, 38, 'THE COMMONS', 'bold 7px system-ui, sans-serif', '#ffffff');
      drawDoor(ctx, P, 'e', W, 0, 2.3, 'The Commons', '#7a4434');
    },
  };
}

export const bookstore = () =>
  slab({ w: 7, d: 4, mat: 'brick', name: 'University Bookstore', door: { side: 's', u: 2.8 },
    tiers: [{ x: 0, y: 0, w: 7, d: 4, h: 43, win: 'ribbon', floorH: 22 }] });

export function crossroads(): BuildingSpec {
  const W = 8;
  const D = 6;
  return {
    w: W,
    d: D,
    maxH: 80,
    draw(ctx, P) {
      isoBox(ctx, P, 0, 0, W, D, 0, 52, '#c9a27a', { top: '#8f8a84' });
      // vertical wood slats
      ctx.strokeStyle = '#a07a52';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let u = 0.1; u < W; u += 0.22) {
        ctx.moveTo(...P(u, D, 26));
        ctx.lineTo(...P(u, D, 52));
      }
      for (let u = 0.1; u < D; u += 0.22) {
        ctx.moveTo(...P(W, u, 26));
        ctx.lineTo(...P(W, u, 52));
      }
      ctx.stroke();
      faceWindows(ctx, (u, v) => P(u, D, v), W, 0, 26, 'curtain', 26, true);
      faceWindows(ctx, (u, v) => P(W, u, v), D, 0, 26, 'curtain', 26, false);
      // floating roof overhang
      isoBox(ctx, P, -0.3, -0.3, W + 0.6, D + 0.6, 52, 5, '#e9e6df', { top: '#d9d4ca' });
      textOnSouth(ctx, P, W / 2, D, 40, 'CROSSROADS CULINARY CENTER', 'bold 5.5px system-ui, sans-serif', '#3b2a1e');
      drawDoor(ctx, P, 's', 0, D, 3.3);
    },
  };
}
