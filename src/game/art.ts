/**
 * Procedural art kit. Everything in the world is drawn with Canvas 2D at
 * startup (no external image files), so the style stays consistent:
 * soft outlines, warm autumn palette, gentle shading from the top-left.
 */
import { shade } from '../character/avatarRenderer';

export const RES = 2; // textures are drawn at 2x for crisp HiDPI rendering
const HW = 32;
const HH = 16;

export type Ctx = CanvasRenderingContext2D;

export interface ArtTexture {
  canvas: HTMLCanvasElement;
  originX: number; // 0..1
  originY: number; // 0..1
}

/** Create a canvas of logical size w x h (drawn at RES) with the anchor point (ax, ay). */
export function makeArt(w: number, h: number, ax: number, ay: number, draw: (ctx: Ctx) => void): ArtTexture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * RES);
  canvas.height = Math.ceil(h * RES);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(RES, RES);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  return { canvas, originX: ax / w, originY: ay / h };
}

// ---------- primitives ----------
export function quad(ctx: Ctx, pts: [number, number][], fill: string, stroke?: string, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Point projector for a local origin (bx, by) on screen. */
export function projector(bx: number, by: number) {
  return (gx: number, gy: number, z = 0): [number, number] => [bx + (gx - gy) * HW, by + (gx + gy) * HH - z];
}

/**
 * Draws an isometric box whose footprint spans (x..x+w, y..y+d) at elevation z.
 * Only the three camera-facing faces are drawn (top, south, east).
 */
export function isoBox(
  ctx: Ctx,
  P: ReturnType<typeof projector>,
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  h: number,
  color: string,
  opts: { top?: string; outline?: boolean } = {},
) {
  const line = opts.outline === false ? undefined : shade(color, -0.45);
  // south face (left-front) — lit
  quad(ctx, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(color, 0.04), line, 0.8);
  // east face (right-front) — shadowed
  quad(ctx, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(color, -0.16), line, 0.8);
  // top
  quad(ctx, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], opts.top ?? shade(color, 0.18), line, 0.8);
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Deterministic pseudo-random generator so the campus looks the same for everyone. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ---------- buildings ----------
export interface BuildingSpec {
  w: number; // footprint in tiles (gx direction)
  d: number; // footprint in tiles (gy direction)
  maxH: number; // tallest point in px (for canvas size)
  draw: (ctx: Ctx, P: ReturnType<typeof projector>) => void;
}

/** Renders a building so that the footprint's north corner (0,0) is the anchor. */
export function makeBuilding(spec: BuildingSpec): ArtTexture & { anchorPx: { x: number; y: number } } {
  const pad = 12;
  const w = (spec.w + spec.d) * HW + pad * 2;
  const h = (spec.w + spec.d) * HH + spec.maxH + pad * 2;
  const ax = spec.d * HW + pad;
  const ay = spec.maxH + pad;
  const art = makeArt(w, h, ax, ay, (ctx) => {
    const P = projector(ax, ay);
    // soft contact shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    quad(ctx, [P(-0.3, -0.3), P(spec.w + 0.6, -0.3), P(spec.w + 0.6, spec.d + 0.6), P(-0.3, spec.d + 0.6)], '#1b2a3a');
    ctx.restore();
    spec.draw(ctx, P);
  });
  return { ...art, anchorPx: { x: ax, y: ay } };
}

// ---------- vegetation ----------
const TREE_PALETTES: Record<string, string[]> = {
  green: ['#4f9a4a', '#6cb85a', '#8fd06b'],
  green2: ['#3f8a54', '#57a866', '#7cc77d'],
  orange: ['#d9772b', '#f0963c', '#ffc163'],
  red: ['#b8452f', '#d65d3d', '#f28a5b'],
  gold: ['#c99a1f', '#e8bd3a', '#ffe07a'],
  cherry: ['#e58fb3', '#f5aecb', '#ffd4e6'],
};

export function tree(palette: keyof typeof TREE_PALETTES, seed: number): ArtTexture {
  const pal = TREE_PALETTES[palette];
  const r = rng(seed);
  return makeArt(84, 118, 42, 108, (ctx) => {
    ellipse(ctx, 42, 108, 22, 8, 'rgba(25,40,30,0.22)');
    // trunk
    quad(ctx, [[38, 108], [46, 108], [45, 66], [39, 66]], '#7a5236', '#4d3322', 1);
    quad(ctx, [[42, 78], [52, 64], [54, 66], [44, 82]], '#7a5236', '#4d3322', 1);
    // canopy blobs (dark → light)
    const blobs: [number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const ang = r() * Math.PI * 2;
      const dist = 6 + r() * 14;
      blobs.push([42 + Math.cos(ang) * dist, 46 + Math.sin(ang) * dist * 0.8, 13 + r() * 6]);
    }
    for (const [x, y, rad] of blobs) ellipse(ctx, x, y + 3, rad, rad * 0.95, pal[0], shade(pal[0], -0.35), 1);
    for (const [x, y, rad] of blobs) ellipse(ctx, x - 1.5, y - 1, rad * 0.8, rad * 0.75, pal[1]);
    for (const [x, y, rad] of blobs.slice(0, 5)) ellipse(ctx, x - 4, y - 5, rad * 0.4, rad * 0.32, pal[2]);
  });
}

export function pine(seed: number): ArtTexture {
  const r = rng(seed);
  return makeArt(70, 128, 35, 118, (ctx) => {
    ellipse(ctx, 35, 118, 18, 6, 'rgba(25,40,30,0.22)');
    quad(ctx, [[32, 118], [38, 118], [38, 96], [32, 96]], '#6e4a31', '#4d3322', 1);
    const greens = ['#2f6e4a', '#3d855a', '#4f9b6a'];
    for (let i = 0; i < 4; i++) {
      const y = 100 - i * 20;
      const wd = 30 - i * 6 + r() * 3;
      quad(ctx, [[35, y - 34], [35 + wd, y], [35 - wd, y]], greens[0], '#1f4a33', 1);
      quad(ctx, [[35, y - 32], [35 + wd * 0.55, y - 6], [35 - wd * 0.8, y - 2]], greens[1]);
      quad(ctx, [[34, y - 30], [33 - wd * 0.3, y - 10], [30 - wd * 0.5, y - 8]], greens[2]);
    }
  });
}

export function bush(seed: number, color = '#5ea65a'): ArtTexture {
  const r = rng(seed);
  return makeArt(44, 34, 22, 28, (ctx) => {
    ellipse(ctx, 22, 28, 16, 5, 'rgba(25,40,30,0.2)');
    for (let i = 0; i < 5; i++) {
      ellipse(ctx, 12 + i * 5, 18 + r() * 4, 8, 7.5, color, shade(color, -0.35), 1);
    }
    for (let i = 0; i < 3; i++) ellipse(ctx, 14 + i * 7, 15, 3, 2, shade(color, 0.3));
    if (r() > 0.5) for (let i = 0; i < 4; i++) ellipse(ctx, 10 + r() * 24, 12 + r() * 10, 1.4, 1.4, '#ffd6e6');
  });
}

// ---------- street furniture ----------
export function bench(alongX: boolean): ArtTexture {
  return makeArt(80, 56, 40, 40, (ctx) => {
    const P = projector(40, 40);
    const [w, d] = alongX ? [1.6, 0.45] : [0.45, 1.6];
    const x = -w / 2;
    const y = -d / 2;
    ellipse(ctx, 40, 42, 26, 8, 'rgba(0,0,0,0.15)');
    // legs
    for (const [lx, ly] of alongX ? [[x + 0.1, y + 0.3], [x + w - 0.2, y + 0.3]] : [[x + 0.3, y + 0.1], [x + 0.3, y + d - 0.2]]) {
      isoBox(ctx, P, lx, ly, 0.1, 0.1, 0, 10, '#3b3f46');
    }
    // seat
    isoBox(ctx, P, x, y, w, d, 10, 3, '#b07a4a', { top: '#c98f5a' });
    // backrest
    if (alongX) isoBox(ctx, P, x, y - 0.05, w, 0.1, 13, 12, '#a06c3e', { top: '#c98f5a' });
    else isoBox(ctx, P, x - 0.05, y, 0.1, d, 13, 12, '#a06c3e', { top: '#c98f5a' });
  });
}

export function lamp(): ArtTexture {
  return makeArt(40, 110, 20, 104, (ctx) => {
    ellipse(ctx, 20, 104, 8, 3, 'rgba(0,0,0,0.2)');
    const g = ctx.createRadialGradient(20, 22, 2, 20, 22, 22);
    g.addColorStop(0, 'rgba(255,230,160,0.55)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 40, 46);
    quad(ctx, [[18, 104], [22, 104], [21.5, 30], [18.5, 30]], '#2f3a46', '#1b232c', 0.8);
    quad(ctx, [[15, 104], [25, 104], [24, 98], [16, 98]], '#2f3a46');
    quad(ctx, [[13, 30], [27, 30], [24, 16], [16, 16]], '#fff2c4', '#2f3a46', 1.2);
    quad(ctx, [[12, 17], [28, 17], [20, 9]], '#2f3a46');
    // UB-blue light-pole banner
    quad(ctx, [[22, 40], [33, 42], [33, 68], [22, 66]], '#005bbb', '#003f85', 0.8);
    ctx.save();
    ctx.translate(27.5, 54);
    ctx.transform(1, 0.18, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UB', 0, 0);
    ctx.restore();
  });
}

export function trashCan(): ArtTexture {
  return makeArt(26, 36, 13, 32, (ctx) => {
    ellipse(ctx, 13, 32, 9, 3, 'rgba(0,0,0,0.2)');
    quad(ctx, [[6, 31], [20, 31], [21, 12], [5, 12]], '#3f6e55', '#24412f', 1);
    ellipse(ctx, 13, 12, 8, 3, '#2d5240', '#24412f', 1);
    quad(ctx, [[9, 22], [17, 22], [17, 26], [9, 26]], '#e6efe9');
  });
}

export function signPost(lines: string[], color = '#005bbb'): ArtTexture {
  const width = Math.max(64, Math.max(...lines.map((l) => l.length)) * 6.4 + 16);
  const height = 22 + lines.length * 11;
  return makeArt(width + 8, height + 40, width / 2 + 4, height + 36, (ctx) => {
    ellipse(ctx, width / 2 + 4, height + 36, width / 3, 4, 'rgba(0,0,0,0.18)');
    quad(ctx, [[width / 2 + 1, height + 36], [width / 2 + 7, height + 36], [width / 2 + 7, height], [width / 2 + 1, height]], '#5b4636');
    ctx.beginPath();
    ctx.roundRect(4, 4, width, height, 6);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = shade(color, -0.45);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      ctx.font = i === 0 ? 'bold 10px system-ui, sans-serif' : '9px system-ui, sans-serif';
      ctx.fillText(l, width / 2 + 4, 15 + i * 11);
    });
  });
}

export function plaque(): ArtTexture {
  return makeArt(40, 56, 20, 50, (ctx) => {
    ellipse(ctx, 20, 50, 14, 4, 'rgba(0,0,0,0.2)');
    const P = projector(20, 46);
    isoBox(ctx, P, -0.3, -0.3, 0.6, 0.6, 0, 26, '#b9b2a6');
    quad(ctx, [P(-0.25, 0.3, 10), P(0.25, 0.3, 10), P(0.25, 0.3, 24), P(-0.25, 0.3, 24)], '#c89b3c', '#7a5a1a', 0.8);
    ellipse(ctx, 20, 18, 3, 3, '#ffd75e', '#8a6a1a', 0.8);
  });
}

export function fountain(): ArtTexture {
  return makeArt(170, 110, 85, 70, (ctx) => {
    ellipse(ctx, 85, 76, 78, 34, 'rgba(0,0,0,0.15)');
    ellipse(ctx, 85, 68, 76, 36, '#cfc6b6', '#8d8475', 1.5);
    ellipse(ctx, 85, 64, 70, 32, '#bfb5a3');
    ellipse(ctx, 85, 66, 64, 28, '#4fa3d6', '#3a7ca6', 1);
    ellipse(ctx, 75, 60, 26, 9, 'rgba(255,255,255,0.25)');
    // center tiers
    quad(ctx, [[79, 66], [91, 66], [89, 36], [81, 36]], '#d8cfbf', '#8d8475', 1);
    ellipse(ctx, 85, 38, 20, 8, '#d8cfbf', '#8d8475', 1);
    ellipse(ctx, 85, 37, 16, 6, '#6db8e3');
    quad(ctx, [[82, 38], [88, 38], [87, 22], [83, 22]], '#d8cfbf', '#8d8475', 1);
  });
}

export function flagpole(): ArtTexture {
  return makeArt(60, 130, 12, 124, (ctx) => {
    ellipse(ctx, 12, 124, 8, 3, 'rgba(0,0,0,0.2)');
    quad(ctx, [[10.5, 124], [13.5, 124], [13, 6], [11, 6]], '#d9dee4', '#8a96a3', 0.8);
    ellipse(ctx, 12, 6, 2.5, 2.5, '#ffd75e');
  });
}

export function flag(): ArtTexture {
  return makeArt(44, 28, 0, 0, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(22, -4, 44, 2);
    ctx.lineTo(44, 26);
    ctx.quadraticCurveTo(22, 22, 0, 26);
    ctx.closePath();
    ctx.fillStyle = '#005bbb';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UB', 22, 13);
  });
}

export function bikeRack(): ArtTexture {
  return makeArt(80, 44, 40, 34, (ctx) => {
    ellipse(ctx, 40, 34, 30, 7, 'rgba(0,0,0,0.12)');
    ctx.strokeStyle = '#7f8b98';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(18 + i * 13, 28 + i * 0, 7, Math.PI, 0);
      ctx.stroke();
    }
    // a parked bike
    ctx.strokeStyle = '#d94b4b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(30, 28, 6, 0, Math.PI * 2);
    ctx.arc(46, 28, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, 28);
    ctx.lineTo(37, 20);
    ctx.lineTo(46, 28);
    ctx.moveTo(37, 20);
    ctx.lineTo(44, 20);
    ctx.stroke();
  });
}

export function mapBoard(): ArtTexture {
  return makeArt(84, 84, 42, 78, (ctx) => {
    ellipse(ctx, 42, 78, 26, 6, 'rgba(0,0,0,0.18)');
    quad(ctx, [[20, 78], [24, 78], [24, 40], [20, 40]], '#4a3a2c');
    quad(ctx, [[60, 78], [64, 78], [64, 40], [60, 40]], '#4a3a2c');
    ctx.beginPath();
    ctx.roundRect(8, 6, 68, 46, 5);
    ctx.fillStyle = '#2f4e3b';
    ctx.fill();
    ctx.strokeStyle = '#1d3326';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#e9f2e1';
    ctx.fillRect(12, 16, 60, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPUS MAP', 42, 13);
    // tiny map
    ctx.fillStyle = '#9fd18a';
    ctx.fillRect(13, 17, 58, 30);
    ctx.fillStyle = '#e8d9b8';
    ctx.fillRect(13, 30, 58, 3);
    ctx.fillRect(40, 17, 3, 30);
    ctx.fillStyle = '#005bbb';
    ctx.fillRect(18, 20, 10, 7);
    ctx.fillStyle = '#b9785a';
    ctx.fillRect(52, 19, 12, 7);
    ctx.fillStyle = '#7fb8e0';
    ctx.fillRect(52, 36, 11, 8);
    ctx.fillStyle = '#4fa3d6';
    ctx.beginPath();
    ctx.ellipse(68, 31, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d94b4b';
    ctx.beginPath();
    ctx.arc(41, 38, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Co-op pressure plate (on / off). */
export function plate(on: boolean, label: string): ArtTexture {
  return makeArt(90, 56, 45, 28, (ctx) => {
    const P = projector(45, 28);
    quad(ctx, [P(-0.75, -0.75), P(0.75, -0.75), P(0.75, 0.75), P(-0.75, 0.75)], '#5b6470', '#2f353d', 1.5);
    isoBox(ctx, P, -0.55, -0.55, 1.1, 1.1, 0, 4, on ? '#ffd75e' : '#9aa6b2', { top: on ? '#fff0a6' : '#c3cbd4' });
    ctx.fillStyle = on ? '#7a5a00' : '#3b4450';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(45, 24);
    ctx.scale(1, 0.6);
    ctx.fillText(label, 0, 0);
    ctx.restore();
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      quad(ctx, [P(-0.9, -0.9), P(0.9, -0.9), P(0.9, 0.9), P(-0.9, 0.9)], 'rgba(255,215,94,0.0)', '#ffe27a', 3);
      ctx.restore();
    }
  });
}

export function portalArch(): ArtTexture {
  return makeArt(90, 110, 45, 100, (ctx) => {
    ellipse(ctx, 45, 100, 30, 8, 'rgba(0,0,0,0.2)');
    ctx.strokeStyle = '#8d8475';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(18, 100);
    ctx.lineTo(18, 46);
    ctx.arc(45, 46, 27, Math.PI, 0);
    ctx.lineTo(72, 100);
    ctx.stroke();
    ctx.strokeStyle = '#cfc6b6';
    ctx.lineWidth = 5;
    ctx.stroke();
    // vines
    ctx.fillStyle = '#5ea65a';
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + (i / 13) * Math.PI;
      ellipse(ctx, 45 + Math.cos(a) * 27, 46 + Math.sin(a) * 27, 3.2, 2.4, i % 3 ? '#5ea65a' : '#f28a5b');
    }
  });
}

export function portalSwirl(): ArtTexture {
  return makeArt(56, 56, 28, 28, (ctx) => {
    const g = ctx.createRadialGradient(28, 28, 2, 28, 28, 27);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#b9e6ff');
    g.addColorStop(0.7, '#7a5cd6');
    g.addColorStop(1, 'rgba(122,92,214,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(28, 28, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(28, 28, 8 + i * 6, i, i + Math.PI * 1.2);
      ctx.stroke();
    }
  });
}

export function photoBooth(): ArtTexture {
  return makeArt(96, 120, 48, 104, (ctx) => {
    const P = projector(48, 100);
    ellipse(ctx, 48, 104, 34, 9, 'rgba(0,0,0,0.18)');
    isoBox(ctx, P, -0.7, -0.5, 1.4, 1.0, 0, 70, '#f2a93b', { top: '#ffd27a' });
    quad(ctx, [P(-0.5, 0.5, 6), P(0.5, 0.5, 6), P(0.5, 0.5, 58), P(-0.5, 0.5, 58)], '#d94b4b', '#7a2222', 1);
    // curtain folds
    for (let i = 1; i < 5; i++) {
      const u = -0.5 + i * 0.2;
      quad(ctx, [P(u, 0.5, 6), P(u + 0.03, 0.5, 6), P(u + 0.03, 0.5, 58), P(u, 0.5, 58)], '#b83c3c');
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const [tx, ty] = P(0, 0.5, 64);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillText('PHOTO', 0, 0);
    ctx.restore();
    ellipse(ctx, P(0.7, 0, 50)[0], P(0.7, 0, 50)[1], 5, 5, '#2b2f38', '#111', 1);
    ellipse(ctx, P(0.7, 0, 50)[0], P(0.7, 0, 50)[1], 2.4, 2.4, '#6db8e3');
  });
}

export function bullStatue(): ArtTexture {
  return makeArt(110, 110, 55, 100, (ctx) => {
    const P = projector(55, 96);
    ellipse(ctx, 55, 100, 40, 11, 'rgba(0,0,0,0.2)');
    isoBox(ctx, P, -0.9, -0.6, 1.8, 1.2, 0, 22, '#b9b2a6');
    // original stylised bull silhouette in bronze
    const c = '#8c6a3c';
    const o = '#4d3a20';
    ctx.save();
    ctx.translate(55, 58);
    ellipse(ctx, 0, 0, 26, 13, c, o, 1.5); // body
    ellipse(ctx, 24, -8, 11, 9, c, o, 1.5); // head
    quad(ctx, [[28, -16], [40, -26], [36, -14]], '#e9dcc0', o, 1); // horn
    quad(ctx, [[18, -16], [12, -28], [22, -16]], '#e9dcc0', o, 1); // horn
    for (const x of [-18, -8, 8, 16]) quad(ctx, [[x - 3, 8], [x + 3, 8], [x + 3, 22], [x - 3, 22]], c, o, 1);
    ctx.strokeStyle = o;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, -3);
    ctx.quadraticCurveTo(-36, 2, -32, 12);
    ctx.stroke();
    ellipse(ctx, 28, -10, 1.4, 1.4, '#2a1d10');
    ellipse(ctx, -6, -6, 8, 3, 'rgba(255,240,200,0.35)');
    ctx.restore();
  });
}

export function lantern(): ArtTexture {
  return makeArt(34, 70, 17, 64, (ctx) => {
    const g = ctx.createRadialGradient(17, 22, 2, 17, 22, 17);
    g.addColorStop(0, 'rgba(255,200,120,0.7)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 4, 34, 36);
    quad(ctx, [[16, 64], [18, 64], [18, 30], [16, 30]], '#3b2f28');
    ctx.beginPath();
    ctx.roundRect(10, 14, 14, 16, 4);
    ctx.fillStyle = '#ffb35c';
    ctx.fill();
    ctx.strokeStyle = '#7a3b1a';
    ctx.stroke();
  });
}

// ---------- interior furniture ----------
export function tableRound(): ArtTexture {
  return makeArt(76, 60, 38, 44, (ctx) => {
    ellipse(ctx, 38, 46, 24, 9, 'rgba(0,0,0,0.18)');
    quad(ctx, [[36, 46], [40, 46], [40, 24], [36, 24]], '#5b4636');
    ellipse(ctx, 38, 24, 26, 12, '#c98f5a', '#7a5236', 1.2);
    ellipse(ctx, 38, 22, 26, 12, '#e0a86e', '#7a5236', 1.2);
    // coffee cups
    ellipse(ctx, 30, 20, 3, 1.6, '#ffffff', '#999', 0.6);
    ellipse(ctx, 46, 23, 3, 1.6, '#ffffff', '#999', 0.6);
  });
}

export function chair(color = '#005bbb'): ArtTexture {
  return makeArt(40, 52, 20, 44, (ctx) => {
    const P = projector(20, 44);
    ellipse(ctx, 20, 44, 11, 4, 'rgba(0,0,0,0.16)');
    isoBox(ctx, P, -0.25, -0.25, 0.5, 0.5, 0, 12, '#3b3f46');
    isoBox(ctx, P, -0.28, -0.28, 0.56, 0.56, 12, 3, color);
    isoBox(ctx, P, -0.28, -0.28, 0.56, 0.08, 15, 14, color);
  });
}

export function vending(front: string, label: string): ArtTexture {
  return makeArt(70, 120, 35, 106, (ctx) => {
    const P = projector(35, 104);
    ellipse(ctx, 35, 106, 24, 7, 'rgba(0,0,0,0.2)');
    isoBox(ctx, P, -0.45, -0.4, 0.9, 0.8, 0, 76, '#e9edf1', { top: '#f6f8fa' });
    // glowing front on the east face
    quad(ctx, [P(0.45, -0.3, 30), P(0.45, 0.3, 30), P(0.45, 0.3, 72), P(0.45, -0.3, 72)], front, shade(front, -0.4), 1);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const y0 = -0.25 + c * 0.18;
        const z0 = 36 + r * 9;
        quad(ctx, [P(0.45, y0, z0), P(0.45, y0 + 0.12, z0), P(0.45, y0 + 0.12, z0 + 6), P(0.45, y0, z0 + 6)], ['#ff6b6b', '#ffd75e', '#6be3a0', '#6db8e3'][(r + c) % 4]);
      }
    }
    quad(ctx, [P(0.45, -0.3, 10), P(0.45, 0.3, 10), P(0.45, 0.3, 20), P(0.45, -0.3, 20)], '#2b2f38');
    ctx.save();
    const [tx, ty] = P(0.45, 0, 26);
    ctx.translate(tx, ty);
    ctx.transform(1, -0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

export function couch(color: string, alongX: boolean): ArtTexture {
  return makeArt(110, 70, 55, 50, (ctx) => {
    const P = projector(55, 50);
    const [w, d] = alongX ? [2, 0.8] : [0.8, 2];
    ellipse(ctx, 55, 52, 40, 12, 'rgba(0,0,0,0.16)');
    isoBox(ctx, P, -w / 2, -d / 2, w, d, 0, 12, color);
    if (alongX) {
      isoBox(ctx, P, -w / 2, -d / 2, w, 0.25, 12, 14, shade(color, -0.08));
      isoBox(ctx, P, -w / 2, -d / 2, 0.25, d, 12, 8, shade(color, -0.05));
      isoBox(ctx, P, w / 2 - 0.25, -d / 2, 0.25, d, 12, 8, shade(color, -0.05));
    } else {
      isoBox(ctx, P, -w / 2, -d / 2, 0.25, d, 12, 14, shade(color, -0.08));
      isoBox(ctx, P, -w / 2, -d / 2, w, 0.25, 12, 8, shade(color, -0.05));
      isoBox(ctx, P, -w / 2, d / 2 - 0.25, w, 0.25, 12, 8, shade(color, -0.05));
    }
  });
}

export function coffeeTable(): ArtTexture {
  return makeArt(70, 44, 35, 30, (ctx) => {
    const P = projector(35, 30);
    isoBox(ctx, P, -0.5, -0.4, 1, 0.8, 0, 9, '#8a5a3a', { top: '#a8714a' });
    ellipse(ctx, 32, 18, 4, 2, '#ffffff');
    quad(ctx, [[38, 21], [46, 17], [50, 19], [42, 23]], '#d94b4b');
  });
}

export function plant(): ArtTexture {
  return makeArt(40, 70, 20, 64, (ctx) => {
    ellipse(ctx, 20, 64, 11, 4, 'rgba(0,0,0,0.2)');
    quad(ctx, [[12, 50], [28, 50], [26, 64], [14, 64]], '#c96f4a', '#7a3b1a', 1);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.38;
      ctx.save();
      ctx.translate(20, 50);
      ctx.rotate(a + Math.PI / 2);
      ellipse(ctx, 0, -14, 4, 13, i % 2 ? '#4f9a4a' : '#6cb85a', '#2f6a35', 0.8);
      ctx.restore();
    }
  });
}

export function counterDesk(): ArtTexture {
  // L-less straight welcome desk, 4 tiles along x
  return makeArt(220, 120, 110, 76, (ctx) => {
    const P = projector(110, 76);
    ellipse(ctx, 110, 80, 96, 22, 'rgba(0,0,0,0.12)');
    isoBox(ctx, P, -2, -0.5, 4, 1, 0, 26, '#005bbb', { top: '#f3efe6' });
    quad(ctx, [P(-1.8, 0.5, 6), P(1.8, 0.5, 6), P(1.8, 0.5, 20), P(-1.8, 0.5, 20)], '#0a4f9c');
    ctx.save();
    const [tx, ty] = P(0, 0.5, 13);
    ctx.translate(tx, ty);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WELCOME DESK', 0, 0);
    ctx.restore();
    // monitor + bell
    isoBox(ctx, P, -1.2, -0.3, 0.1, 0.5, 26, 14, '#2b2f38');
    ellipse(ctx, P(0.9, 0, 28)[0], P(0.9, 0, 28)[1], 5, 3, '#ffd75e', '#8a6a1a', 0.8);
  });
}

export function sparkle(): ArtTexture {
  return makeArt(16, 16, 8, 8, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(10, 6);
    ctx.lineTo(16, 8);
    ctx.lineTo(10, 10);
    ctx.lineTo(8, 16);
    ctx.lineTo(6, 10);
    ctx.lineTo(0, 8);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
  });
}

export function confettiPiece(): ArtTexture {
  return makeArt(6, 10, 3, 5, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 6, 10);
  });
}

export function leaf(): ArtTexture {
  return makeArt(10, 8, 5, 4, (ctx) => {
    ellipse(ctx, 5, 4, 4.5, 2.5, '#ffffff');
  });
}

export function bird(): ArtTexture {
  return makeArt(20, 14, 10, 12, (ctx) => {
    ellipse(ctx, 10, 12, 6, 2, 'rgba(0,0,0,0.2)');
    ellipse(ctx, 9, 7, 6, 4, '#7a5a44', '#3b2a1e', 0.8);
    ellipse(ctx, 14, 5, 3, 3, '#7a5a44', '#3b2a1e', 0.8);
    quad(ctx, [[16.5, 5], [19.5, 6], [16.5, 6.5]], '#f2a93b');
    ellipse(ctx, 14.6, 4.4, 0.7, 0.7, '#111');
  });
}

export function squirrel(): ArtTexture {
  return makeArt(26, 22, 13, 20, (ctx) => {
    ellipse(ctx, 13, 20, 8, 2.5, 'rgba(0,0,0,0.2)');
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.quadraticCurveTo(-2, 10, 6, 2);
    ctx.quadraticCurveTo(10, 8, 10, 14);
    ctx.fillStyle = '#b06a3a';
    ctx.fill();
    ctx.strokeStyle = '#6b3b1a';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ellipse(ctx, 14, 15, 5, 4, '#a5623a', '#6b3b1a', 0.8);
    ellipse(ctx, 19, 10, 3.2, 3, '#a5623a', '#6b3b1a', 0.8);
    ellipse(ctx, 20, 9.5, 0.6, 0.6, '#111');
  });
}

// ---------- Student Union interior (from 1992 + 2025 reference photos) ----------
/** Navy information desk under the balcony. */
export function infoDesk(): ArtTexture {
  return makeArt(220, 120, 110, 76, (ctx) => {
    const P = projector(110, 76);
    ellipse(ctx, 110, 80, 96, 22, 'rgba(0,0,0,0.12)');
    isoBox(ctx, P, -2, -0.5, 4, 1, 0, 26, '#2a3550', { top: '#c9a87a' });
    quad(ctx, [P(-1.9, 0.5, 4), P(1.9, 0.5, 4), P(1.9, 0.5, 22), P(-1.9, 0.5, 22)], '#232d45');
    ctx.save();
    const [tx, ty] = P(0, 0.5, 13);
    ctx.translate(tx, ty);
    ctx.transform(1, 0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('INFORMATION', 0, 0);
    ctx.restore();
    isoBox(ctx, P, -1.4, -0.3, 0.1, 0.5, 26, 14, '#1d1f26');
    isoBox(ctx, P, 0.8, -0.35, 0.5, 0.4, 26, 3, '#f4f4f4');
    ellipse(ctx, P(1.5, 0, 28)[0], P(1.5, 0, 28)[1], 4, 2.4, '#ffd75e', '#8a6a1a', 0.8);
  });
}

/** Food counter along a wall (runs along gy), with menu boards. */
export function cafeCounter(): ArtTexture {
  return makeArt(150, 150, 75, 112, (ctx) => {
    const P = projector(75, 108);
    ellipse(ctx, 75, 110, 60, 20, 'rgba(0,0,0,0.12)');
    // back shelf with menu boards
    isoBox(ctx, P, -0.6, -2, 0.25, 4, 0, 74, '#3b2f2a');
    for (let i = 0; i < 3; i++) {
      const y0 = -1.85 + i * 1.3;
      quad(ctx, [P(-0.35, y0, 46), P(-0.35, y0 + 1.1, 46), P(-0.35, y0 + 1.1, 70), P(-0.35, y0, 70)], '#1d1f26', '#000', 0.6);
      ctx.fillStyle = ['#ffd75e', '#ff8fb1', '#6be3a0'][i];
      for (let l = 0; l < 3; l++) {
        const a = P(-0.35, y0 + 0.15, 64 - l * 6);
        const b = P(-0.35, y0 + 0.15 + 0.5 + (l % 2) * 0.3, 64 - l * 6);
        ctx.fillRect(a[0], a[1], b[0] - a[0], 1.4);
      }
    }
    // counter
    isoBox(ctx, P, -0.1, -2, 0.8, 4, 0, 24, '#d94b4b', { top: '#efe7da' });
    quad(ctx, [P(0.7, -1.9, 6), P(0.7, 1.9, 6), P(0.7, 1.9, 18), P(0.7, -1.9, 18)], '#b83c3c');
    ctx.save();
    const [tx, ty] = P(0.7, 0, 12);
    ctx.translate(tx, ty);
    ctx.transform(1, -0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BULLS CAFÉ', 0, 0);
    ctx.restore();
    // coffee machine, cups, pastry case
    isoBox(ctx, P, 0, -1.6, 0.4, 0.5, 24, 14, '#9aa3ad');
    isoBox(ctx, P, 0.05, 0.6, 0.5, 1, 24, 9, '#bfe2f2', { top: '#e6f4fa' });
    for (let i = 0; i < 3; i++) ellipse(ctx, P(0.3, -0.6 + i * 0.3, 26)[0], P(0.3, -0.6 + i * 0.3, 26)[1], 2.2, 1.2, '#ffffff', '#999', 0.5);
  });
}

/** White round column (supports the balcony). */
export function column(): ArtTexture {
  return makeArt(30, 96, 15, 90, (ctx) => {
    ellipse(ctx, 15, 90, 12, 5, 'rgba(0,0,0,0.15)');
    const g = ctx.createLinearGradient(5, 0, 25, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c9c4ba');
    ctx.fillStyle = g;
    ctx.fillRect(6, 6, 18, 84);
    ellipse(ctx, 15, 90, 9, 4, '#d9d4ca');
    ellipse(ctx, 15, 6, 9, 4, '#f4f1ea', '#c9c4ba', 0.6);
  });
}

export function armchair(color: string): ArtTexture {
  return makeArt(60, 56, 30, 42, (ctx) => {
    const P = projector(30, 42);
    ellipse(ctx, 30, 44, 20, 7, 'rgba(0,0,0,0.16)');
    isoBox(ctx, P, -0.4, -0.4, 0.8, 0.8, 0, 11, color);
    isoBox(ctx, P, -0.4, -0.4, 0.8, 0.2, 11, 13, shade(color, -0.08));
    isoBox(ctx, P, -0.4, -0.4, 0.18, 0.8, 11, 7, shade(color, -0.05));
  });
}

/** Low study table with a laptop. */
export function studyTable(): ArtTexture {
  return makeArt(100, 60, 50, 40, (ctx) => {
    const P = projector(50, 40);
    ellipse(ctx, 50, 42, 40, 11, 'rgba(0,0,0,0.14)');
    for (const [x, y] of [[-0.9, -0.35], [0.8, -0.35], [-0.9, 0.25], [0.8, 0.25]]) isoBox(ctx, P, x, y, 0.08, 0.08, 0, 14, '#3b3f46');
    isoBox(ctx, P, -1, -0.45, 2, 0.9, 14, 2.5, '#e9e2d3', { top: '#f4efe6' });
    isoBox(ctx, P, -0.5, -0.2, 0.45, 0.35, 16.5, 1, '#9aa3ad');
    quad(ctx, [P(-0.5, -0.2, 17.5), P(-0.05, -0.2, 17.5), P(-0.05, -0.2, 26), P(-0.5, -0.2, 26)], '#2b2f38', '#111', 0.5);
    ellipse(ctx, P(0.5, 0.1, 17)[0], P(0.5, 0.1, 17)[1], 2.2, 1.2, '#ffffff', '#999', 0.5);
  });
}
