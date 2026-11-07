/**
 * Procedural, layered avatar renderer.
 *
 * Every avatar is drawn from the same body template (32 x 48 logical units),
 * layer by layer: shadow → back hair/backpack → legs → shoes → torso → arms →
 * accessories → head → face → hair → glasses → hat. Because all clothes are
 * drawn relative to the same body, outfits always fit and stay aligned while
 * walking. The same code renders the editor preview and the in-game sprites.
 */
import type { Appearance } from './appearance';

export type Facing = 'front' | 'back' | 'side';
export const FACINGS: Facing[] = ['front', 'back', 'side'];
export const FRAME_W = 32;
export const FRAME_H = 48;
export const WALK_FRAMES = 4; // + 1 idle frame (index 0)

// ---------- color helpers ----------
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** amt < 0 darkens, amt > 0 lightens (range -1..1). */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const m = (c: number) => Math.round(c + (t - c) * p).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
}

// ---------- shape helpers ----------
type Ctx = CanvasRenderingContext2D;
const OUTLINE = 0.7;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function paint(ctx: Ctx, fill: string, outline = true, base?: string) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = shade(base ?? toHex(fill), -0.45);
    ctx.lineWidth = OUTLINE;
    ctx.stroke();
  }
}

function toHex(c: string): string {
  if (c.startsWith('#')) return c;
  const m = c.match(/\d+/g);
  if (!m) return '#888888';
  return '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
}

function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

// ---------- main entry ----------
/**
 * Draws one frame. `ctx` must already be scaled so 1 unit = 1 logical pixel,
 * with the frame's top-left at (0,0).
 * frame 0 = idle, 1..4 = walk cycle.
 */
export function drawAvatarFrame(ctx: Ctx, a: Appearance, facing: Facing, frame: number) {
  const p = frame === 0 ? -1 : (frame - 1) % 4;
  const swing = p < 0 ? 0 : [0, 1, 0, -1][p];
  const bob = p < 0 ? 0 : p % 2 === 0 ? -0.8 : 0;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // soft ground shadow (not affected by bob)
  ellipse(ctx, 16, 46, 8.5, 2.6);
  ctx.fillStyle = 'rgba(20,20,40,0.22)';
  ctx.fill();

  if (facing === 'front') drawFront(ctx, a, swing, bob);
  else if (facing === 'back') drawBack(ctx, a, swing, bob);
  else drawSide(ctx, a, swing, bob);

  ctx.restore();
}

// ---------- shared parts ----------
function legsFront(ctx: Ctx, a: Appearance, swing: number) {
  const liftL = Math.max(0, swing) * 1.4;
  const liftR = Math.max(0, -swing) * 1.4;
  for (const [x, lift] of [
    [11.6, liftL],
    [16.4, liftR],
  ] as const) {
    const bottom = 43 - lift;
    drawLeg(ctx, a, x, 33, 4, bottom - 33);
    drawShoe(ctx, a, x - 0.4, bottom - 1.5, 4.8);
  }
  if (a.pants === 'skirt') {
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(22, 32);
    ctx.lineTo(23.5, 39);
    ctx.lineTo(8.5, 39);
    ctx.closePath();
    paint(ctx, a.pantsColor);
    // pleats
    ctx.strokeStyle = shade(a.pantsColor, -0.25);
    ctx.lineWidth = 0.5;
    for (const x of [13, 16, 19]) {
      ctx.beginPath();
      ctx.moveTo(x, 33.5);
      ctx.lineTo(x + (x - 16) * 0.25, 38.5);
      ctx.stroke();
    }
  }
}

function drawLeg(ctx: Ctx, a: Appearance, x: number, y: number, w: number, h: number) {
  // skin underneath (visible for shorts / skirt)
  rr(ctx, x + 0.3, y, w - 0.6, h, 1.2);
  paint(ctx, a.skin);
  let pantsLen = h;
  if (a.pants === 'shorts') pantsLen = 5;
  if (a.pants === 'skirt') pantsLen = 0;
  if (pantsLen > 0) {
    rr(ctx, x, y, w, pantsLen, 1.2);
    paint(ctx, a.pantsColor);
    if (a.pants === 'joggers' && pantsLen > 4) {
      rr(ctx, x, y + pantsLen - 1.6, w, 1.6, 0.6);
      paint(ctx, shade(a.pantsColor, -0.25), false);
    }
    if (a.pants === 'jeans' && pantsLen > 4) {
      ctx.strokeStyle = shade(a.pantsColor, 0.25);
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 1);
      ctx.lineTo(x + w / 2, y + pantsLen - 1);
      ctx.stroke();
    }
  }
}

function drawShoe(ctx: Ctx, a: Appearance, x: number, y: number, w: number) {
  const tall = a.shoes === 'boots' ? 3 : a.shoes === 'hightops' ? 1.6 : 0;
  rr(ctx, x, y - tall, w, 3 + tall, 1.3);
  paint(ctx, a.shoesColor);
  // sole
  rr(ctx, x - 0.2, y + 2.1, w + 0.4, 1.1, 0.5);
  paint(ctx, a.shoes === 'boots' ? shade(a.shoesColor, -0.5) : '#f7f7f2', false);
  if (a.shoes === 'hightops') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 0.8, y - tall + 0.8, w - 1.6, 0.6);
  }
}

function sleeveColor(a: Appearance): string {
  return a.top === 'varsity' ? '#f3f1ea' : a.topColor;
}

function drawArm(ctx: Ctx, a: Appearance, x: number, y: number, len: number, dark = false) {
  const sc = dark ? shade(sleeveColor(a), -0.15) : sleeveColor(a);
  const skin = dark ? shade(a.skin, -0.1) : a.skin;
  if (a.top === 'tshirt') {
    rr(ctx, x + 0.3, y + 2, 3, len - 2, 1.4);
    paint(ctx, skin, true, a.skin);
    rr(ctx, x, y, 3.6, 4, 1.4);
    paint(ctx, sc, true, sleeveColor(a));
  } else {
    rr(ctx, x, y, 3.6, len, 1.5);
    paint(ctx, sc, true, sleeveColor(a));
    // cuff
    rr(ctx, x, y + len - 1.4, 3.6, 1.4, 0.6);
    paint(ctx, shade(sleeveColor(a), -0.2), false);
  }
  circle(ctx, x + 1.8, y + len + 0.9, 1.7);
  paint(ctx, skin, true, a.skin);
}

function torsoFront(ctx: Ctx, a: Appearance) {
  rr(ctx, 9, 22.5, 14, 12, 3.4);
  paint(ctx, a.topColor);
  const dark = shade(a.topColor, -0.22);
  if (a.top === 'hoodie') {
    // hood rim + pocket + strings
    rr(ctx, 11, 21.2, 10, 3, 1.5);
    paint(ctx, dark, false);
    rr(ctx, 12, 29.5, 8, 3.6, 1.4);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(14.5, 24);
    ctx.lineTo(14.3, 27);
    ctx.moveTo(17.5, 24);
    ctx.lineTo(17.7, 27);
    ctx.stroke();
  } else if (a.top === 'jacket') {
    // open front showing shirt
    ctx.beginPath();
    ctx.moveTo(14, 22.6);
    ctx.lineTo(18, 22.6);
    ctx.lineTo(17.2, 34.4);
    ctx.lineTo(14.8, 34.4);
    ctx.closePath();
    paint(ctx, '#f1efe8', false);
    // collar
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(11.5, 22.6);
    ctx.lineTo(14.5, 22.6);
    ctx.lineTo(14.2, 26);
    ctx.closePath();
    ctx.moveTo(20.5, 22.6);
    ctx.lineTo(17.5, 22.6);
    ctx.lineTo(17.8, 26);
    ctx.closePath();
    ctx.fill();
  } else if (a.top === 'varsity') {
    // stripes + letter
    ctx.fillStyle = '#f3f1ea';
    ctx.fillRect(9.4, 32.2, 13.2, 1);
    ctx.fillStyle = '#f3f1ea';
    ctx.font = 'bold 6px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 18.6, 27);
    ctx.strokeStyle = shade(a.topColor, -0.4);
    ctx.lineWidth = 0.3;
    ctx.strokeText('B', 18.6, 27);
  } else {
    // t-shirt collar
    ctx.beginPath();
    ctx.arc(16, 22.6, 2.4, 0, Math.PI);
    ctx.fillStyle = dark;
    ctx.fill();
  }
  // waist band
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(9.5, 33.3, 13, 1);
}

function headBase(ctx: Ctx, a: Appearance, cx: number, cy: number) {
  circle(ctx, cx, cy, 9.6);
  paint(ctx, a.skin);
}

// ---------- hair ----------
function hairFront(ctx: Ctx, a: Appearance, cx: number, cy: number) {
  const c = a.hairColor;
  if (a.hair === 'bald') return;
  if (a.hair === 'buzz') {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(cx, cy, 9.7, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(cx, cy - 3.5, cx - 9.4, cy - 1.5);
    paint(ctx, c);
    ctx.restore();
    return;
  }
  // top cap with fringe
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 1);
  ctx.arc(cx, cy, 10.1, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + 10, cy + 1);
  if (a.hair === 'spiky') {
    ctx.lineTo(cx + 7, cy - 3);
    ctx.lineTo(cx + 4, cy - 1);
    ctx.lineTo(cx + 1, cy - 4);
    ctx.lineTo(cx - 2, cy - 1.5);
    ctx.lineTo(cx - 5, cy - 4);
    ctx.lineTo(cx - 7.5, cy - 1);
  } else {
    ctx.quadraticCurveTo(cx + 7, cy - 4.5, cx + 3, cy - 3.2);
    ctx.quadraticCurveTo(cx - 1, cy - 1.2, cx - 4, cy - 3.6);
    ctx.quadraticCurveTo(cx - 8, cy - 3, cx - 10, cy + 1);
  }
  ctx.closePath();
  paint(ctx, c);
  // highlight
  ctx.strokeStyle = shade(c, 0.35);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx - 1, cy - 1, 7.5, Math.PI * 1.2, Math.PI * 1.45);
  ctx.stroke();

  if (a.hair === 'spiky') {
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(cx + i * 3.5 - 2.2, cy - 8);
      ctx.lineTo(cx + i * 3.8, cy - 14);
      ctx.lineTo(cx + i * 3.5 + 2.2, cy - 8);
    }
    paint(ctx, c);
  }
  if (a.hair === 'long') {
    for (const s of [-1, 1]) {
      rr(ctx, cx + s * 8.6 - 2.2, cy - 1, 4.4, 13, 2.2);
      paint(ctx, c);
    }
  }
  if (a.hair === 'curly') {
    for (let i = 0; i < 9; i++) {
      const ang = Math.PI + (i / 8) * Math.PI;
      circle(ctx, cx + Math.cos(ang) * 9.6, cy + Math.sin(ang) * 9.6 + 0.5, 2.6);
      paint(ctx, c);
    }
  }
  if (a.hair === 'bun') {
    circle(ctx, cx, cy - 11, 3.6);
    paint(ctx, c);
  }
}

function hairBackLayer(ctx: Ctx, a: Appearance, cx: number, cy: number) {
  // hair that is BEHIND the head in front/side view (long hair, ponytail)
  if (a.hair === 'long') {
    rr(ctx, cx - 10.5, cy - 4, 21, 18, 6);
    paint(ctx, shade(a.hairColor, -0.12), true, a.hairColor);
  }
}

function hairBack(ctx: Ctx, a: Appearance, cx: number, cy: number) {
  // seen from behind: hair covers most of the head
  const c = a.hairColor;
  if (a.hair === 'bald') return;
  ctx.save();
  if (a.hair === 'buzz') ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, Math.PI * 0.92, Math.PI * 2.08);
  ctx.quadraticCurveTo(cx, cy + 9, cx - 9.9, cy + 2.6);
  ctx.closePath();
  paint(ctx, c);
  ctx.restore();
  if (a.hair === 'long') {
    rr(ctx, cx - 9.5, cy, 19, 13.5, 5);
    paint(ctx, c);
  }
  if (a.hair === 'ponytail') {
    rr(ctx, cx - 2, cy + 4, 4, 11, 2);
    paint(ctx, c);
    rr(ctx, cx - 2.2, cy + 3.5, 4.4, 1.6, 0.6);
    paint(ctx, a.accentColor, false);
  }
  if (a.hair === 'bun') {
    circle(ctx, cx, cy - 8.5, 3.8);
    paint(ctx, c);
  }
  if (a.hair === 'curly') {
    for (let i = 0; i < 11; i++) {
      const ang = Math.PI * 0.9 + (i / 10) * Math.PI * 1.2;
      circle(ctx, cx + Math.cos(ang) * 9.6, cy + Math.sin(ang) * 9.6, 2.7);
      paint(ctx, c);
    }
  }
  if (a.hair === 'spiky') {
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(cx + i * 3.5 - 2.2, cy - 8);
      ctx.lineTo(cx + i * 3.8, cy - 14);
      ctx.lineTo(cx + i * 3.5 + 2.2, cy - 8);
    }
    paint(ctx, c);
  }
}

// ---------- head wear ----------
function hat(ctx: Ctx, a: Appearance, cx: number, cy: number, facing: Facing) {
  const c = a.accentColor;
  if (a.hat === 'none') return;
  if (a.hat === 'beanie') {
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 10.4, Math.PI, Math.PI * 2);
    ctx.closePath();
    paint(ctx, c);
    rr(ctx, cx - 10.8, cy - 3, 21.6, 3.6, 1.6);
    paint(ctx, shade(c, -0.15), true, c);
    circle(ctx, cx + (facing === 'side' ? -2 : 0), cy - 12.2, 2.4);
    paint(ctx, '#f7f3ea');
    return;
  }
  if (a.hat === 'cap') {
    ctx.beginPath();
    ctx.arc(cx, cy - 1.5, 10.2, Math.PI, Math.PI * 2);
    ctx.closePath();
    paint(ctx, c);
    if (facing === 'front') {
      ellipse(ctx, cx, cy - 1.2, 9.5, 2.6);
      paint(ctx, shade(c, -0.25), true, c);
    } else if (facing === 'side') {
      ellipse(ctx, cx + 9, cy - 1.6, 6, 1.6);
      paint(ctx, shade(c, -0.25), true, c);
    } else {
      rr(ctx, cx - 2.5, cy - 2.8, 5, 1.6, 0.6);
      paint(ctx, shade(c, -0.3), false);
    }
    circle(ctx, cx, cy - 11.6, 0.9);
    paint(ctx, shade(c, -0.3), false);
    return;
  }
  // bucket
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 2);
  ctx.quadraticCurveTo(cx - 8, cy - 12, cx, cy - 12);
  ctx.quadraticCurveTo(cx + 8, cy - 12, cx + 8, cy - 2);
  ctx.closePath();
  paint(ctx, c);
  ellipse(ctx, cx, cy - 1.5, 12.5, 2.8);
  paint(ctx, shade(c, -0.12), true, c);
}

function headphones(ctx: Ctx, a: Appearance, cx: number, cy: number, facing: Facing) {
  if (a.accessory !== 'headphones') return;
  const c = a.accentColor;
  ctx.strokeStyle = shade(c, -0.3);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, 10.8, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  const cups = facing === 'side' ? [cx - 2.5] : [cx - 10.2, cx + 10.2];
  for (const x of cups) {
    rr(ctx, x - 2, cy - 1.5, 4, 6, 1.8);
    paint(ctx, c);
  }
}

function glasses(ctx: Ctx, a: Appearance, eyes: [number, number][], facing: Facing) {
  if (a.glasses === 'none' || facing === 'back') return;
  const frame = '#2a2530';
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = frame;
  for (const [x, y] of eyes) {
    if (a.glasses === 'round') {
      circle(ctx, x, y, 2.5);
      ctx.fillStyle = 'rgba(200,230,255,0.25)';
      ctx.fill();
      ctx.stroke();
    } else if (a.glasses === 'square') {
      rr(ctx, x - 2.6, y - 2, 5.2, 4, 0.8);
      ctx.fillStyle = 'rgba(200,230,255,0.25)';
      ctx.fill();
      ctx.stroke();
    } else {
      rr(ctx, x - 2.8, y - 1.9, 5.6, 3.6, 1.4);
      ctx.fillStyle = '#1d1b26';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x - 1.8, y - 1.2, 1.4, 0.6);
    }
  }
  ctx.beginPath();
  if (eyes.length === 2) {
    ctx.moveTo(eyes[0][0] + 2.4, eyes[0][1] - 0.4);
    ctx.lineTo(eyes[1][0] - 2.4, eyes[1][1] - 0.4);
  } else {
    // temple arm to the ear
    ctx.moveTo(eyes[0][0] - 2.6, eyes[0][1] - 0.5);
    ctx.lineTo(eyes[0][0] - 7.5, eyes[0][1] - 1);
  }
  ctx.stroke();
}

function eye(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y, 1.15, 1.55);
  ctx.fillStyle = '#2b2230';
  ctx.fill();
  circle(ctx, x + 0.4, y - 0.6, 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

/** A slightly darker copy of the look, for limbs further from the camera. */
function darker(a: Appearance): Appearance {
  return {
    ...a,
    skin: shade(a.skin, -0.12),
    topColor: shade(a.topColor, -0.12),
    pantsColor: shade(a.pantsColor, -0.12),
    shoesColor: shade(a.shoesColor, -0.12),
  };
}

// ---------- views ----------
function drawFront(ctx: Ctx, a: Appearance, swing: number, bob: number) {
  const cx = 16;
  const cy = 13.5 + bob;
  ctx.save();
  ctx.translate(0, bob);
  hairBackLayer(ctx, a, cx, 13.5);
  if (a.backpack === 'classic') {
    rr(ctx, 7.6, 23.5, 16.8, 10, 3);
    paint(ctx, shade(a.accentColor, -0.15), true, a.accentColor);
  }
  ctx.restore();

  legsFront(ctx, a, swing);

  ctx.save();
  ctx.translate(0, bob);
  // neck
  rr(ctx, 14.2, 19.5, 3.6, 4, 1);
  paint(ctx, shade(a.skin, -0.08), false);
  drawArm(ctx, a, 5.9, 23.4 + swing * 0.8, 9.2);
  drawArm(ctx, a, 22.5, 23.4 - swing * 0.8, 9.2);
  torsoFront(ctx, a);
  // backpack straps
  if (a.backpack === 'classic') {
    ctx.fillStyle = shade(a.accentColor, -0.1);
    rr(ctx, 10.6, 22.8, 1.8, 9, 0.8);
    ctx.fill();
    rr(ctx, 19.6, 22.8, 1.8, 9, 0.8);
    ctx.fill();
  } else if (a.backpack === 'sling') {
    ctx.strokeStyle = shade(a.accentColor, -0.1);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(20.5, 23);
    ctx.lineTo(11.5, 32.5);
    ctx.stroke();
  }
  if (a.accessory === 'lanyard') {
    ctx.strokeStyle = '#005bbb';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(13.5, 22.8);
    ctx.lineTo(16, 28);
    ctx.lineTo(18.5, 22.8);
    ctx.stroke();
    rr(ctx, 14.3, 27.6, 3.4, 4.2, 0.6);
    paint(ctx, '#ffffff');
    ctx.fillStyle = '#005bbb';
    ctx.fillRect(14.7, 28.1, 2.6, 1);
  }
  if (a.accessory === 'scarf') {
    rr(ctx, 10.5, 20.8, 11, 3.6, 1.6);
    paint(ctx, a.accentColor);
    rr(ctx, 17.5, 22.5, 3, 7, 1.2);
    paint(ctx, shade(a.accentColor, -0.1), true, a.accentColor);
  }
  ctx.restore();

  // head
  headBase(ctx, a, cx, cy);
  // ears
  for (const s of [-1, 1]) {
    circle(ctx, cx + s * 9.4, cy + 1.5, 1.8);
    paint(ctx, a.skin);
  }
  headBase(ctx, a, cx, cy);
  // face
  eye(ctx, cx - 3.6, cy + 1.6);
  eye(ctx, cx + 3.6, cy + 1.6);
  ctx.fillStyle = 'rgba(255,120,130,0.28)';
  ellipse(ctx, cx - 5.6, cy + 4.4, 1.6, 1);
  ctx.fill();
  ellipse(ctx, cx + 5.6, cy + 4.4, 1.6, 1);
  ctx.fill();
  ctx.strokeStyle = '#7a3b3b';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy + 4.6, 1.3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  hairFront(ctx, a, cx, cy);
  glasses(ctx, a, [
    [cx - 3.6, cy + 1.6],
    [cx + 3.6, cy + 1.6],
  ], 'front');
  headphones(ctx, a, cx, cy, 'front');
  hat(ctx, a, cx, cy, 'front');
}

function drawBack(ctx: Ctx, a: Appearance, swing: number, bob: number) {
  const cx = 16;
  const cy = 13.5 + bob;
  legsFront(ctx, a, -swing);
  ctx.save();
  ctx.translate(0, bob);
  drawArm(ctx, a, 5.9, 23.4 - swing * 0.8, 9.2);
  drawArm(ctx, a, 22.5, 23.4 + swing * 0.8, 9.2);
  rr(ctx, 9, 22.5, 14, 12, 3.4);
  paint(ctx, a.topColor);
  if (a.top === 'hoodie') {
    // hood lying on the back
    ctx.beginPath();
    ctx.moveTo(10.5, 22.5);
    ctx.quadraticCurveTo(16, 30, 21.5, 22.5);
    ctx.closePath();
    paint(ctx, shade(a.topColor, -0.18), true, a.topColor);
  }
  if (a.top === 'varsity') {
    ctx.fillStyle = '#f3f1ea';
    ctx.font = 'bold 5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UB', 16, 28.5);
  }
  if (a.backpack === 'classic') {
    rr(ctx, 9.6, 23.2, 12.8, 11.4, 3.2);
    paint(ctx, a.accentColor);
    rr(ctx, 10.4, 23.4, 11.2, 4, 2);
    paint(ctx, shade(a.accentColor, -0.15), true, a.accentColor);
    rr(ctx, 12.5, 29.2, 7, 3.6, 1.2);
    paint(ctx, shade(a.accentColor, 0.12), true, a.accentColor);
  } else if (a.backpack === 'sling') {
    rr(ctx, 15, 25.5, 8, 6, 2);
    paint(ctx, a.accentColor);
    ctx.strokeStyle = shade(a.accentColor, -0.1);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(11.5, 23);
    ctx.lineTo(16, 26);
    ctx.stroke();
  }
  if (a.accessory === 'scarf') {
    rr(ctx, 10.5, 20.8, 11, 3.6, 1.6);
    paint(ctx, a.accentColor);
  }
  ctx.restore();

  for (const s of [-1, 1]) {
    circle(ctx, cx + s * 9.4, cy + 1.5, 1.8);
    paint(ctx, a.skin);
  }
  headBase(ctx, a, cx, cy);
  hairBack(ctx, a, cx, cy);
  headphones(ctx, a, cx, cy, 'back');
  hat(ctx, a, cx, cy, 'back');
}

function drawSide(ctx: Ctx, a: Appearance, swing: number, bob: number) {
  // facing RIGHT (flip the sprite to face left)
  const cx = 16.5;
  const cy = 13.5 + bob;
  const legX = 14;
  // back leg (darker), then front leg
  const back = { x: legX - swing * 2.4 };
  const front = { x: legX + swing * 2.4 };
  const dimmed = darker(a);
  for (const [leg, look] of [
    [back, dimmed],
    [front, a],
  ] as const) {
    drawLeg(ctx, look, leg.x, 33, 4, 10);
    drawShoe(ctx, look, leg.x - 0.2, 41.5, 5.6);
  }
  if (a.pants === 'skirt') {
    ctx.beginPath();
    ctx.moveTo(11.5, 32);
    ctx.lineTo(20.5, 32);
    ctx.lineTo(22.5, 39);
    ctx.lineTo(10, 39);
    ctx.closePath();
    paint(ctx, a.pantsColor);
  }

  ctx.save();
  ctx.translate(0, bob);
  // back arm
  drawArm(ctx, dimmed, 13.5 + swing * 1.6, 23.4, 9);
  // backpack on the back (left)
  if (a.backpack === 'classic') {
    rr(ctx, 6.6, 23.6, 6, 10.5, 2.2);
    paint(ctx, a.accentColor);
  } else if (a.backpack === 'sling') {
    rr(ctx, 8, 27, 5, 5, 1.8);
    paint(ctx, a.accentColor);
  }
  rr(ctx, 10.6, 22.5, 11, 12, 3.4);
  paint(ctx, a.topColor);
  if (a.top === 'hoodie') {
    ctx.beginPath();
    ctx.moveTo(10.8, 22.5);
    ctx.quadraticCurveTo(10, 28, 13.5, 27);
    ctx.lineTo(14, 22.5);
    ctx.closePath();
    paint(ctx, shade(a.topColor, -0.18), true, a.topColor);
  }
  if (a.backpack !== 'none') {
    ctx.fillStyle = shade(a.accentColor, -0.1);
    rr(ctx, 13.4, 22.6, 1.8, 9, 0.8);
    ctx.fill();
  }
  if (a.accessory === 'scarf') {
    rr(ctx, 11.2, 20.8, 10, 3.6, 1.6);
    paint(ctx, a.accentColor);
    rr(ctx, 9, 22, 3, 6.5, 1.2);
    paint(ctx, shade(a.accentColor, -0.1), true, a.accentColor);
  }
  if (a.accessory === 'lanyard') {
    rr(ctx, 19.6, 27, 2.2, 4, 0.5);
    paint(ctx, '#ffffff');
  }
  // front arm
  drawArm(ctx, a, 14.2 - swing * 1.6, 23.4, 9);
  ctx.restore();

  // head
  hairBackLayer(ctx, a, cx - 1.5, 13.5 + bob);
  if (a.hair === 'ponytail') {
    rr(ctx, cx - 14, cy - 1, 6, 4, 2);
    paint(ctx, a.hairColor);
    rr(ctx, cx - 12.5, cy + 1, 4, 9, 2);
    paint(ctx, a.hairColor);
  }
  headBase(ctx, a, cx, cy);
  // nose + eye + mouth
  circle(ctx, cx + 9.4, cy + 2.6, 1.3);
  paint(ctx, a.skin);
  eye(ctx, cx + 5, cy + 1.6);
  ctx.fillStyle = 'rgba(255,120,130,0.28)';
  ellipse(ctx, cx + 4.5, cy + 4.6, 1.6, 1);
  ctx.fill();
  ctx.strokeStyle = '#7a3b3b';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx + 6.5, cy + 5.4);
  ctx.lineTo(cx + 8, cy + 5.2);
  ctx.stroke();

  // side hair: cover top + back of head
  if (a.hair !== 'bald') {
    const c = a.hairColor;
    ctx.save();
    if (a.hair === 'buzz') ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(cx - 9.9, cy + 3.5);
    ctx.arc(cx, cy, 10.1, Math.PI * 0.95, Math.PI * 1.9);
    if (a.hair === 'spiky') {
      ctx.lineTo(cx + 6, cy - 3);
      ctx.lineTo(cx + 3, cy - 2);
    } else {
      ctx.quadraticCurveTo(cx + 7, cy - 2.5, cx + 3.5, cy - 2.6);
    }
    ctx.quadraticCurveTo(cx - 1, cy - 2, cx - 1.5, cy + 2);
    ctx.quadraticCurveTo(cx - 4, cy + 6, cx - 9.9, cy + 3.5);
    ctx.closePath();
    paint(ctx, c);
    ctx.restore();
    if (a.hair === 'spiky') {
      ctx.beginPath();
      for (let i = -2; i <= 1; i++) {
        ctx.moveTo(cx + i * 3.6 - 2, cy - 8.5);
        ctx.lineTo(cx + i * 3.6 - 2.5, cy - 14);
        ctx.lineTo(cx + i * 3.6 + 2.2, cy - 8.5);
      }
      paint(ctx, c);
    }
    if (a.hair === 'curly') {
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI * 0.85 + (i / 7) * Math.PI * 0.95;
        circle(ctx, cx + Math.cos(ang) * 9.6, cy + Math.sin(ang) * 9.6, 2.6);
        paint(ctx, c);
      }
    }
    if (a.hair === 'bun') {
      circle(ctx, cx - 2, cy - 10.5, 3.6);
      paint(ctx, c);
    }
  }
  // ear
  circle(ctx, cx - 1.5, cy + 2.2, 1.9);
  paint(ctx, a.skin);
  glasses(ctx, a, [[cx + 5, cy + 1.6]], 'side');
  headphones(ctx, a, cx + 1, cy, 'side');
  hat(ctx, a, cx, cy, 'side');
}

// ---------- sprite sheets ----------
/**
 * Renders a full sprite sheet: rows = facings (front, back, side),
 * columns = frames (idle + 4 walk). Returns the canvas.
 */
export function renderSpriteSheet(a: Appearance, scale = 3): HTMLCanvasElement {
  const cols = 1 + WALK_FRAMES;
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * scale * cols;
  canvas.height = FRAME_H * scale * FACINGS.length;
  const ctx = canvas.getContext('2d')!;
  FACINGS.forEach((facing, row) => {
    for (let f = 0; f < cols; f++) {
      ctx.save();
      ctx.translate(f * FRAME_W * scale, row * FRAME_H * scale);
      ctx.scale(scale, scale);
      drawAvatarFrame(ctx, a, facing, f);
      ctx.restore();
    }
  });
  return canvas;
}

/** Draw a single preview (used by the character editor and menus). */
export function drawPreview(canvas: HTMLCanvasElement, a: Appearance, facing: Facing, frame: number) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / FRAME_W, canvas.height / FRAME_H);
  ctx.save();
  ctx.translate((canvas.width - FRAME_W * scale) / 2, canvas.height - FRAME_H * scale);
  ctx.scale(scale, scale);
  drawAvatarFrame(ctx, a, facing, frame);
  ctx.restore();
}
