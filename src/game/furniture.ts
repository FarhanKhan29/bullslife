/**
 * Interior furniture & equipment for all building interiors.
 * Every piece is anchored at the centre of its floor footprint.
 */
import { shade } from '../character/avatarRenderer';
import { isoBox, makeArt, projector, quad, type ArtTexture, type Ctx } from './art';

function shadow(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
}

function dot(ctx: Ctx, x: number, y: number, r: number, c: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
}

function label(ctx: Ctx, at: [number, number], text: string, size: number, color: string, skew: 1 | -1 = 1) {
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.transform(1, 0.5 * skew, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Canvas big enough for a footprint of w x d tiles and height h px. */
function canvasFor(w: number, d: number, h: number, draw: (ctx: Ctx, P: ReturnType<typeof projector>) => void): ArtTexture {
  const cw = (w + d) * 32 + 24;
  const ch = (w + d) * 16 + h + 24;
  const ax = cw / 2 + ((d - w) * 32) / 2 + ((w - d) * 32) / 2; // centre of footprint
  const ay = h + 12 + ((w + d) * 16) / 2;
  return makeArt(cw, ch, ax, ay, (ctx) => {
    const P = projector(ax, ay);
    shadow(ctx, ax, ay + 2, ((w + d) * 32) / 2.4, ((w + d) * 16) / 2.6);
    draw(ctx, P);
  });
}

// ------------------------------------------------------------------ bedroom
export function bed(blanket: string, alongX = false): ArtTexture {
  const [w, d] = alongX ? [2, 1] : [1, 2];
  return canvasFor(w, d, 40, (ctx, P) => {
    const x = -w / 2;
    const y = -d / 2;
    isoBox(ctx, P, x, y, w, d, 0, 10, '#8a5a3a');
    isoBox(ctx, P, x + 0.05, y + 0.05, w - 0.1, d - 0.1, 10, 5, '#f4f1ea');
    // blanket over the foot end
    if (alongX) isoBox(ctx, P, x + 0.7, y + 0.02, w - 0.72, d - 0.04, 12, 4, blanket);
    else isoBox(ctx, P, x + 0.02, y + 0.7, w - 0.04, d - 0.72, 12, 4, blanket);
    // pillow + headboard
    if (alongX) {
      isoBox(ctx, P, x + 0.1, y + 0.2, 0.45, d - 0.4, 15, 3, '#ffffff');
      isoBox(ctx, P, x - 0.05, y, 0.1, d, 0, 28, '#6b4428');
    } else {
      isoBox(ctx, P, x + 0.2, y + 0.1, w - 0.4, 0.45, 15, 3, '#ffffff');
      isoBox(ctx, P, x, y - 0.05, w, 0.1, 0, 28, '#6b4428');
    }
  });
}

export function desk(kind: 'pc' | 'lamp' | 'books', alongX = true): ArtTexture {
  const [w, d] = alongX ? [1.4, 0.7] : [0.7, 1.4];
  return canvasFor(w, d, 50, (ctx, P) => {
    const x = -w / 2;
    const y = -d / 2;
    for (const [lx, ly] of [
      [x, y],
      [x + w - 0.08, y],
      [x, y + d - 0.08],
      [x + w - 0.08, y + d - 0.08],
    ])
      isoBox(ctx, P, lx, ly, 0.08, 0.08, 0, 16, '#3b3f46');
    isoBox(ctx, P, x, y, w, d, 16, 3, '#d9c3a0', { top: '#e8d5b5' });
    if (kind === 'pc') {
      if (alongX) {
        isoBox(ctx, P, -0.3, y + 0.05, 0.6, 0.06, 19, 18, '#1d1f26');
        quad(ctx, [P(-0.27, y + 0.11, 21), P(0.27, y + 0.11, 21), P(0.27, y + 0.11, 35), P(-0.27, y + 0.11, 35)], '#4f9fd9');
        isoBox(ctx, P, -0.25, y + 0.3, 0.5, 0.15, 19, 1, '#2b2f38');
      } else {
        isoBox(ctx, P, x + 0.05, -0.3, 0.06, 0.6, 19, 18, '#1d1f26');
        quad(ctx, [P(x + 0.11, -0.27, 21), P(x + 0.11, 0.27, 21), P(x + 0.11, 0.27, 35), P(x + 0.11, -0.27, 35)], '#3d86bf');
        isoBox(ctx, P, x + 0.3, -0.25, 0.15, 0.5, 19, 1, '#2b2f38');
      }
    } else if (kind === 'lamp') {
      isoBox(ctx, P, x + 0.1, y + 0.1, 0.06, 0.06, 19, 16, '#2b2f38');
      const [lx, ly] = P(x + 0.13, y + 0.13, 36);
      dot(ctx, lx, ly, 4, '#ffd75e');
      isoBox(ctx, P, x + 0.5, y + 0.2, 0.4, 0.3, 19, 2, '#ffffff');
    } else {
      ['#d94b4b', '#005bbb', '#3fae6b'].forEach((c, i) => isoBox(ctx, P, x + 0.3 + i * 0.05, y + 0.15, 0.35, 0.3, 19 + i * 2.5, 2.5, c));
    }
  });
}

export function bookshelf(alongX = true, tall = 62): ArtTexture {
  const [w, d] = alongX ? [1.8, 0.45] : [0.45, 1.8];
  return canvasFor(w, d, tall + 10, (ctx, P) => {
    const x = -w / 2;
    const y = -d / 2;
    isoBox(ctx, P, x, y, w, d, 0, tall, '#6b4428');
    const colors = ['#d94b4b', '#005bbb', '#3fae6b', '#f2a93b', '#7a5cd6', '#2b2f38', '#e8d5b5', '#9a4a36'];
    const shelves = Math.floor(tall / 14);
    for (let s = 0; s < shelves; s++) {
      const z = 3 + s * 14;
      if (alongX) {
        quad(ctx, [P(x + 0.05, y + d, z), P(x + w - 0.05, y + d, z), P(x + w - 0.05, y + d, z + 11), P(x + 0.05, y + d, z + 11)], '#3b2618');
        for (let u = x + 0.08; u < x + w - 0.1; u += 0.09) {
          const c = colors[Math.floor(Math.abs(Math.sin(u * 37 + s * 11)) * colors.length)];
          const hgt = 8 + Math.abs(Math.sin(u * 91 + s)) * 3;
          quad(ctx, [P(u, y + d, z), P(u + 0.07, y + d, z), P(u + 0.07, y + d, z + hgt), P(u, y + d, z + hgt)], c);
        }
      } else {
        quad(ctx, [P(x + w, y + 0.05, z), P(x + w, y + d - 0.05, z), P(x + w, y + d - 0.05, z + 11), P(x + w, y + 0.05, z + 11)], '#2e1d12');
        for (let u = y + 0.08; u < y + d - 0.1; u += 0.09) {
          const c = shade(colors[Math.floor(Math.abs(Math.sin(u * 37 + s * 11)) * colors.length)], -0.15);
          const hgt = 8 + Math.abs(Math.sin(u * 91 + s)) * 3;
          quad(ctx, [P(x + w, u, z), P(x + w, u + 0.07, z), P(x + w, u + 0.07, z + hgt), P(x + w, u, z + hgt)], c);
        }
      }
    }
  });
}

export function readingTable(): ArtTexture {
  return canvasFor(2.4, 1, 46, (ctx, P) => {
    for (const [lx, ly] of [
      [-1.15, -0.45],
      [1.07, -0.45],
      [-1.15, 0.37],
      [1.07, 0.37],
    ])
      isoBox(ctx, P, lx, ly, 0.08, 0.08, 0, 16, '#4a3020');
    isoBox(ctx, P, -1.2, -0.5, 2.4, 1, 16, 3, '#7a4a2a', { top: '#8f5a34' });
    for (const lx of [-0.6, 0.6]) {
      isoBox(ctx, P, lx - 0.03, -0.03, 0.06, 0.06, 19, 10, '#c9a54a');
      isoBox(ctx, P, lx - 0.22, -0.1, 0.44, 0.2, 29, 4, '#2f7d4a', { top: '#3f9a5c' });
      const [gx, gy] = P(lx, 0, 28);
      ctx.save();
      ctx.globalAlpha = 0.35;
      dot(ctx, gx, gy + 6, 10, '#fff2b0');
      ctx.restore();
    }
  });
}

// ------------------------------------------------------------------ seating
/** Seat whose occupant faces north/back (towards a stage or screen). */
export function seatBack(color: string): ArtTexture {
  return canvasFor(0.6, 0.6, 34, (ctx, P) => {
    isoBox(ctx, P, -0.22, -0.22, 0.44, 0.44, 0, 11, '#3b3f46');
    isoBox(ctx, P, -0.28, -0.28, 0.56, 0.56, 11, 3, color);
    isoBox(ctx, P, -0.28, 0.2, 0.56, 0.08, 14, 15, shade(color, -0.1));
  });
}

export function bleacher(len: number, alongX = true): ArtTexture {
  const [w, d] = alongX ? [len, 1.5] : [1.5, len];
  return canvasFor(w, d, 40, (ctx, P) => {
    for (let r = 0; r < 3; r++) {
      if (alongX) isoBox(ctx, P, -w / 2, -d / 2 + r * 0.5, w, 0.5, 0, 26 - r * 9, r % 2 ? '#c9c4ba' : '#d9d4ca', { top: '#005bbb' });
      else isoBox(ctx, P, -w / 2 + r * 0.5, -d / 2, 0.5, d, 0, 26 - r * 9, r % 2 ? '#c9c4ba' : '#d9d4ca', { top: '#005bbb' });
    }
  });
}

export function beanbag(color: string): ArtTexture {
  return makeArt(46, 36, 23, 28, (ctx) => {
    shadow(ctx, 23, 28, 16, 6);
    ctx.beginPath();
    ctx.ellipse(23, 21, 16, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = shade(color, -0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(19, 17, 7, 4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = shade(color, 0.25);
    ctx.fill();
  });
}

// ------------------------------------------------------------------ classroom & lecture
export function podium(): ArtTexture {
  return canvasFor(0.8, 0.6, 46, (ctx, P) => {
    isoBox(ctx, P, -0.4, -0.3, 0.8, 0.6, 0, 30, '#6b4428', { top: '#8a5a3a' });
    quad(ctx, [P(-0.35, 0.3, 8), P(0.35, 0.3, 8), P(0.35, 0.3, 24), P(-0.35, 0.3, 24)], '#005bbb');
    label(ctx, P(0, 0.3, 16), 'UB', 7, '#ffffff');
    isoBox(ctx, P, -0.05, -0.2, 0.05, 0.05, 30, 10, '#2b2f38');
  });
}

export function whiteboardStand(): ArtTexture {
  return canvasFor(2, 0.4, 70, (ctx, P) => {
    for (const lx of [-0.9, 0.85]) isoBox(ctx, P, lx, -0.05, 0.06, 0.06, 0, 64, '#9aa3ad');
    isoBox(ctx, P, -1, -0.04, 2, 0.08, 22, 40, '#b9c0c8');
    quad(ctx, [P(-0.95, 0.04, 24), P(0.95, 0.04, 24), P(0.95, 0.04, 60), P(-0.95, 0.04, 60)], '#fbfbf8', '#9aa3ad', 0.8);
    isoBox(ctx, P, -0.9, 0.04, 1.8, 0.1, 22, 1.5, '#9aa3ad');
    for (const [i, c] of ['#d94b4b', '#005bbb', '#2b2f38'].entries()) isoBox(ctx, P, -0.6 + i * 0.15, 0.06, 0.1, 0.06, 23.5, 1, c);
  });
}

// ------------------------------------------------------------------ labs
export function labBench(kind: 'chem' | 'cs' | 'micro'): ArtTexture {
  return canvasFor(2, 0.8, 50, (ctx, P) => {
    isoBox(ctx, P, -1, -0.4, 2, 0.8, 0, 22, '#d9d4ca', { top: '#2b2f38' });
    quad(ctx, [P(-0.9, 0.4, 4), P(0.9, 0.4, 4), P(0.9, 0.4, 18), P(-0.9, 0.4, 18)], '#c4beb3');
    if (kind === 'chem') {
      for (const [i, c] of ['#6be3a0', '#6db8e3', '#ff8fb1'].entries()) {
        const [bx, by] = P(-0.6 + i * 0.5, 0, 22);
        ctx.fillStyle = 'rgba(220,240,255,0.7)';
        ctx.fillRect(bx - 3, by - 12, 6, 12);
        ctx.fillStyle = c;
        ctx.fillRect(bx - 3, by - 6, 6, 6);
      }
    } else if (kind === 'cs') {
      for (const lx of [-0.55, 0.45]) {
        isoBox(ctx, P, lx - 0.25, -0.3, 0.5, 0.05, 22, 16, '#1d1f26');
        quad(ctx, [P(lx - 0.22, -0.25, 24), P(lx + 0.22, -0.25, 24), P(lx + 0.22, -0.25, 36), P(lx - 0.22, -0.25, 36)], '#2f6f4f');
        for (let r = 0; r < 4; r++) quad(ctx, [P(lx - 0.18, -0.25, 34 - r * 2.6), P(lx - 0.18 + 0.1 + ((r * 7) % 3) * 0.08, -0.25, 34 - r * 2.6), P(lx - 0.18 + 0.1 + ((r * 7) % 3) * 0.08, -0.25, 33 - r * 2.6), P(lx - 0.18, -0.25, 33 - r * 2.6)], '#9ff0c0');
      }
    } else {
      isoBox(ctx, P, -0.2, -0.15, 0.4, 0.3, 22, 3, '#f4f4f4');
      isoBox(ctx, P, -0.05, -0.05, 0.1, 0.1, 25, 18, '#2b2f38');
      isoBox(ctx, P, -0.12, -0.1, 0.24, 0.12, 40, 5, '#9aa3ad');
    }
  });
}

export function robotArm(): ArtTexture {
  return makeArt(70, 90, 35, 80, (ctx) => {
    const P = projector(35, 78);
    shadow(ctx, 35, 80, 22, 8);
    isoBox(ctx, P, -0.4, -0.4, 0.8, 0.8, 0, 10, '#f2a93b');
    ctx.strokeStyle = '#f2a93b';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(35, 66);
    ctx.lineTo(28, 40);
    ctx.lineTo(48, 26);
    ctx.stroke();
    ctx.strokeStyle = '#2b2f38';
    ctx.lineWidth = 2;
    ctx.stroke();
    dot(ctx, 28, 40, 5, '#2b2f38');
    dot(ctx, 48, 26, 4, '#2b2f38');
    ctx.strokeStyle = '#9aa3ad';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(48, 26);
    ctx.lineTo(56, 22);
    ctx.moveTo(48, 26);
    ctx.lineTo(55, 31);
    ctx.stroke();
  });
}

export function printer3d(): ArtTexture {
  return canvasFor(0.8, 0.8, 50, (ctx, P) => {
    isoBox(ctx, P, -0.4, -0.4, 0.8, 0.8, 0, 6, '#2b2f38');
    for (const [x, y] of [
      [-0.4, -0.4],
      [0.34, -0.4],
      [-0.4, 0.34],
      [0.34, 0.34],
    ])
      isoBox(ctx, P, x, y, 0.06, 0.06, 6, 36, '#9aa3ad');
    isoBox(ctx, P, -0.4, -0.4, 0.8, 0.8, 42, 4, '#9aa3ad', { top: '#b9c0c8' });
    isoBox(ctx, P, -0.15, -0.15, 0.3, 0.3, 6, 10, '#005bbb');
    isoBox(ctx, P, -0.1, -0.08, 0.2, 0.16, 26, 6, '#d94b4b');
  });
}

export function lathe(): ArtTexture {
  return canvasFor(1.8, 0.7, 46, (ctx, P) => {
    isoBox(ctx, P, -0.9, -0.35, 1.8, 0.7, 0, 22, '#4f7f6a');
    isoBox(ctx, P, -0.85, -0.25, 0.5, 0.5, 22, 18, '#3f6f5a');
    isoBox(ctx, P, 0.5, -0.15, 0.3, 0.3, 22, 12, '#3f6f5a');
    isoBox(ctx, P, -0.35, -0.05, 0.85, 0.1, 30, 3, '#c9c4ba');
    quad(ctx, [P(-0.8, 0.35, 6), P(0.8, 0.35, 6), P(0.8, 0.35, 10), P(-0.8, 0.35, 10)], '#ffd75e');
  });
}

export function draftingTable(): ArtTexture {
  return canvasFor(1.2, 0.9, 50, (ctx, P) => {
    isoBox(ctx, P, -0.55, -0.4, 0.06, 0.06, 0, 26, '#9aa3ad');
    isoBox(ctx, P, 0.5, -0.4, 0.06, 0.06, 0, 26, '#9aa3ad');
    quad(ctx, [P(-0.6, 0.45, 22), P(0.6, 0.45, 22), P(0.6, -0.45, 40), P(-0.6, -0.45, 40)], '#f4f1ea', '#8f8a84', 1);
    ctx.strokeStyle = '#3d86bf';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(...P(-0.4, 0.2, 26));
    ctx.lineTo(...P(0.3, 0.2, 26));
    ctx.lineTo(...P(0.3, -0.2, 34));
    ctx.lineTo(...P(-0.4, -0.2, 34));
    ctx.closePath();
    ctx.stroke();
  });
}

export function shakeTable(): ArtTexture {
  return canvasFor(3, 3, 80, (ctx, P) => {
    isoBox(ctx, P, -1.5, -1.5, 3, 3, 0, 8, '#5e6670', { top: '#7b8896' });
    quad(ctx, [P(-1.4, -1.4, 8.2), P(1.4, -1.4, 8.2), P(1.4, 1.4, 8.2), P(-1.4, 1.4, 8.2)], '#7b8896', '#ffd75e', 1.5);
    // a little 3-storey test frame
    ctx.strokeStyle = '#d94b4b';
    ctx.lineWidth = 2;
    for (const z of [8, 30, 52, 74]) {
      ctx.beginPath();
      ctx.moveTo(...P(-0.6, -0.6, z));
      ctx.lineTo(...P(0.6, -0.6, z));
      ctx.lineTo(...P(0.6, 0.6, z));
      ctx.lineTo(...P(-0.6, 0.6, z));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.beginPath();
    for (const [x, y] of [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.6, 0.6],
      [-0.6, 0.6],
    ]) {
      ctx.moveTo(...P(x, y, 8));
      ctx.lineTo(...P(x, y, 74));
    }
    ctx.stroke();
    ctx.strokeStyle = '#9aa3ad';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(...P(-0.6, 0.6, 8));
    ctx.lineTo(...P(0.6, 0.6, 30));
    ctx.moveTo(...P(0.6, 0.6, 30));
    ctx.lineTo(...P(-0.6, 0.6, 52));
    ctx.stroke();
  });
}

// ------------------------------------------------------------------ sports
export function hoop(rimDir: 1 | -1): ArtTexture {
  return canvasFor(1.2, 1.4, 110, (ctx, P) => {
    isoBox(ctx, P, -0.08 - rimDir * 0.4, -0.08, 0.16, 0.16, 0, 78, '#5e6670');
    isoBox(ctx, P, -0.05, -0.6, 0.1, 1.2, 70, 34, '#ffffff', { top: '#ffffff' });
    quad(ctx, [P(rimDir > 0 ? 0.05 : -0.05, -0.2, 76), P(rimDir > 0 ? 0.05 : -0.05, 0.2, 76), P(rimDir > 0 ? 0.05 : -0.05, 0.2, 90), P(rimDir > 0 ? 0.05 : -0.05, -0.2, 90)], 'rgba(0,0,0,0)', '#d94b4b', 1.5);
    const [rx, ry] = P(rimDir * 0.35, 0, 76);
    ctx.beginPath();
    ctx.ellipse(rx, ry, 9, 4.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#f2733b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) {
      ctx.moveTo(rx + i * 2.6, ry + 2);
      ctx.lineTo(rx + i * 1.6, ry + 13);
    }
    ctx.stroke();
  });
}

export function goalpost(): ArtTexture {
  return makeArt(110, 140, 55, 132, (ctx) => {
    shadow(ctx, 55, 132, 16, 5);
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(55, 132);
    ctx.lineTo(55, 86);
    ctx.moveTo(20, 98);
    ctx.lineTo(90, 74);
    ctx.moveTo(20, 98);
    ctx.lineTo(20, 18);
    ctx.moveTo(90, 74);
    ctx.lineTo(90, 4);
    ctx.stroke();
    ctx.strokeStyle = '#c9a020';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export function pingpong(): ArtTexture {
  return canvasFor(1.6, 0.9, 30, (ctx, P) => {
    for (const [x, y] of [
      [-0.7, -0.35],
      [0.64, -0.35],
      [-0.7, 0.3],
      [0.64, 0.3],
    ])
      isoBox(ctx, P, x, y, 0.06, 0.06, 0, 16, '#2b2f38');
    isoBox(ctx, P, -0.8, -0.45, 1.6, 0.9, 16, 2, '#2f7d4a', { top: '#2f8f55' });
    quad(ctx, [P(-0.8, 0, 18.1), P(0.8, 0, 18.1), P(0.8, 0.02, 18.1), P(-0.8, 0.02, 18.1)], '#ffffff');
    isoBox(ctx, P, -0.02, -0.45, 0.04, 0.9, 18, 5, '#e9e6df');
  });
}

// ------------------------------------------------------------------ arts
export function piano(): ArtTexture {
  return canvasFor(1.4, 1.2, 46, (ctx, P) => {
    for (const [x, y] of [
      [-0.6, -0.5],
      [0.5, -0.5],
      [-0.6, 0.45],
    ])
      isoBox(ctx, P, x, y, 0.08, 0.08, 0, 16, '#111');
    ctx.beginPath();
    const pts: [number, number][] = [P(-0.7, -0.6, 16), P(0.7, -0.6, 16), P(0.7, 0.1, 16), P(0.2, 0.6, 16), P(-0.7, 0.6, 16)];
    ctx.moveTo(...pts[0]);
    pts.forEach((p) => ctx.lineTo(...p));
    ctx.closePath();
    ctx.fillStyle = '#16161a';
    ctx.fill();
    isoBox(ctx, P, -0.7, -0.6, 1.4, 1.2, 16, 8, '#1d1d22', { top: '#26262c' });
    // keys on the west side
    isoBox(ctx, P, -0.85, -0.5, 0.18, 1, 20, 2, '#f7f7f2');
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let y = -0.45; y < 0.5; y += 0.07) {
      ctx.moveTo(...P(-0.85, y, 22));
      ctx.lineTo(...P(-0.67, y, 22));
    }
    ctx.stroke();
    // open lid
    quad(ctx, [P(-0.6, -0.55, 24), P(0.6, -0.55, 24), P(0.4, -0.5, 52)], '#1d1d22', '#000', 0.6);
  });
}

export function easel(): ArtTexture {
  return makeArt(50, 80, 25, 72, (ctx) => {
    shadow(ctx, 25, 72, 14, 5);
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, 72);
    ctx.lineTo(25, 8);
    ctx.lineTo(38, 72);
    ctx.moveTo(25, 8);
    ctx.lineTo(28, 70);
    ctx.stroke();
    ctx.fillStyle = '#fbfbf8';
    ctx.fillRect(11, 14, 28, 30);
    const g = ctx.createLinearGradient(0, 14, 0, 44);
    g.addColorStop(0, '#f2a93b');
    g.addColorStop(1, '#d65d3d');
    ctx.fillStyle = g;
    ctx.fillRect(13, 16, 24, 14);
    ctx.fillStyle = '#4fa3d6';
    ctx.fillRect(13, 30, 24, 12);
    dot(ctx, 25, 30, 5, '#ffd75e');
  });
}

export function sculpture(): ArtTexture {
  return canvasFor(0.8, 0.8, 70, (ctx, P) => {
    isoBox(ctx, P, -0.35, -0.35, 0.7, 0.7, 0, 30, '#f4f1ea');
    const [x, y] = P(0, 0, 30);
    ctx.fillStyle = '#c9a54a';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.quadraticCurveTo(x - 14, y - 22, x, y - 34);
    ctx.quadraticCurveTo(x + 14, y - 22, x + 8, y);
    ctx.closePath();
    ctx.fill();
    dot(ctx, x, y - 30, 6, '#d9b75a');
  });
}

export function drumKit(): ArtTexture {
  return makeArt(80, 60, 40, 48, (ctx) => {
    shadow(ctx, 40, 50, 30, 8);
    const drum = (x: number, y: number, rx: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x - rx, y - h, rx * 2, h);
      ctx.beginPath();
      ctx.ellipse(x, y - h, rx, rx * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f4f4';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI);
      ctx.fillStyle = c;
      ctx.fill();
    };
    drum(40, 46, 12, 14, '#d94b4b');
    drum(22, 36, 7, 8, '#d94b4b');
    drum(57, 36, 7, 8, '#d94b4b');
    ctx.strokeStyle = '#c9a54a';
    ctx.lineWidth = 1.5;
    for (const x of [10, 70]) {
      ctx.beginPath();
      ctx.moveTo(x, 46);
      ctx.lineTo(x, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, 14, 9, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e8bd3a';
      ctx.fill();
    }
  });
}

export function displayCase(): ArtTexture {
  return canvasFor(1.4, 0.7, 50, (ctx, P) => {
    isoBox(ctx, P, -0.7, -0.35, 1.4, 0.7, 0, 22, '#6b4428');
    ctx.save();
    ctx.globalAlpha = 0.35;
    isoBox(ctx, P, -0.65, -0.3, 1.3, 0.6, 22, 18, '#cfe9f5', { outline: false });
    ctx.restore();
    isoBox(ctx, P, -0.3, -0.15, 0.6, 0.3, 22, 2, '#e8d5b5');
    isoBox(ctx, P, -0.25, -0.12, 0.5, 0.24, 24, 1, '#8a5a3a');
  });
}

export function trophyCase(): ArtTexture {
  return canvasFor(1.6, 0.5, 70, (ctx, P) => {
    isoBox(ctx, P, -0.8, -0.25, 1.6, 0.5, 0, 64, '#3b2618');
    quad(ctx, [P(-0.75, 0.25, 4), P(0.75, 0.25, 4), P(0.75, 0.25, 60), P(-0.75, 0.25, 60)], 'rgba(200,230,255,0.35)', '#c9a54a', 1);
    for (const z of [10, 30, 48]) for (let u = -0.55; u < 0.7; u += 0.4) {
      const [x, y] = P(u, 0.2, z);
      ctx.fillStyle = '#e8bd3a';
      ctx.fillRect(x - 2.5, y - 9, 5, 7);
      ctx.fillRect(x - 1, y - 2, 2, 2);
    }
  });
}

// ------------------------------------------------------------------ food & shops
export function foodStation(color: string, name: string, food: string[]): ArtTexture {
  return canvasFor(2.2, 0.9, 80, (ctx, P) => {
    // back wall panel with sign
    isoBox(ctx, P, -1.1, -0.45, 2.2, 0.12, 0, 70, shade(color, -0.25));
    quad(ctx, [P(-0.9, -0.33, 50), P(0.9, -0.33, 50), P(0.9, -0.33, 66), P(-0.9, -0.33, 66)], '#1d1f26');
    label(ctx, P(0, -0.33, 58), name, 7, '#ffffff');
    // counter
    isoBox(ctx, P, -1.1, 0, 2.2, 0.45, 0, 24, color, { top: '#efe7da' });
    ctx.font = '9px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    food.forEach((f, i) => {
      const [x, y] = P(-0.7 + i * 0.5, 0.2, 26);
      ctx.fillText(f, x, y);
    });
    // sneeze guard
    ctx.save();
    ctx.globalAlpha = 0.3;
    quad(ctx, [P(-1, 0.1, 36), P(1, 0.1, 36), P(1, 0.25, 30), P(-1, 0.25, 30)], '#cfe9f5');
    ctx.restore();
  });
}

export function storeShelf(colors: string[], alongX = true): ArtTexture {
  const [w, d] = alongX ? [1.6, 0.5] : [0.5, 1.6];
  return canvasFor(w, d, 50, (ctx, P) => {
    isoBox(ctx, P, -w / 2, -d / 2, w, d, 0, 44, '#e9e6df');
    for (let s = 0; s < 3; s++) {
      const z = 6 + s * 13;
      for (let i = 0; i < 6; i++) {
        const c = colors[(i + s) % colors.length];
        if (alongX) isoBox(ctx, P, -w / 2 + 0.08 + i * 0.25, d / 2 - 0.12, 0.18, 0.1, z, 9, c);
        else isoBox(ctx, P, w / 2 - 0.12, -d / 2 + 0.08 + i * 0.25, 0.1, 0.18, z, 9, c);
      }
    }
  });
}

export function checkout(): ArtTexture {
  return canvasFor(1.4, 0.7, 50, (ctx, P) => {
    isoBox(ctx, P, -0.7, -0.35, 1.4, 0.7, 0, 24, '#005bbb', { top: '#e9e6df' });
    isoBox(ctx, P, 0.2, -0.2, 0.3, 0.3, 24, 10, '#2b2f38');
    quad(ctx, [P(0.2, 0.1, 28), P(0.5, 0.1, 28), P(0.5, 0.1, 33), P(0.2, 0.1, 33)], '#6be3a0');
    label(ctx, P(-0.3, 0.35, 12), 'PAY HERE', 6, '#ffffff');
  });
}

// ------------------------------------------------------------------ home & dorm
export function kitchenCounter(): ArtTexture {
  return canvasFor(2.4, 0.7, 70, (ctx, P) => {
    isoBox(ctx, P, -1.2, -0.35, 2.4, 0.7, 0, 24, '#f4f1ea', { top: '#9aa3ad' });
    // stove + sink
    for (const [x, y] of [
      [-0.8, -0.15],
      [-0.45, -0.15],
      [-0.8, 0.12],
      [-0.45, 0.12],
    ]) {
      const [px, py] = P(x, y, 24.2);
      ctx.beginPath();
      ctx.ellipse(px, py, 4, 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#2b2f38';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    quad(ctx, [P(0.2, -0.2, 24.2), P(0.7, -0.2, 24.2), P(0.7, 0.2, 24.2), P(0.2, 0.2, 24.2)], '#b9c0c8', '#7b8896', 0.8);
    // fridge at the end
    isoBox(ctx, P, 0.85, -0.35, 0.35, 0.7, 24, 34, '#e9edf1');
    isoBox(ctx, P, 0.85, -0.35, 0.35, 0.7, 0, 24, '#e9edf1');
    // microwave
    isoBox(ctx, P, -0.1, -0.3, 0.35, 0.3, 24, 9, '#2b2f38');
  });
}

export function washer(): ArtTexture {
  return canvasFor(0.7, 0.7, 40, (ctx, P) => {
    isoBox(ctx, P, -0.35, -0.35, 0.7, 0.7, 0, 30, '#f4f6f8');
    const [x, y] = P(0, 0.35, 15);
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6db8e3';
    ctx.fill();
    ctx.strokeStyle = '#9aa3ad';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export function tvStand(): ArtTexture {
  return canvasFor(1.6, 0.5, 60, (ctx, P) => {
    isoBox(ctx, P, -0.8, -0.25, 1.6, 0.5, 0, 14, '#3b2618');
    isoBox(ctx, P, -0.7, -0.1, 1.4, 0.06, 14, 30, '#111');
    quad(ctx, [P(-0.66, -0.04, 16), P(0.66, -0.04, 16), P(0.66, -0.04, 42), P(-0.66, -0.04, 42)], '#2d6aa8');
    quad(ctx, [P(-0.6, -0.04, 18), P(0.1, -0.04, 18), P(0.1, -0.04, 26), P(-0.6, -0.04, 26)], '#3fae6b');
  });
}

/** Low partition wall segment (1 tile) for dorm rooms and offices. */
export function partition(alongX: boolean, color = '#e9e2d3'): ArtTexture {
  const [w, d] = alongX ? [1, 0.15] : [0.15, 1];
  return canvasFor(w, d, 56, (ctx, P) => {
    isoBox(ctx, P, -w / 2, -d / 2, w, d, 0, 48, color, { top: shade(color, -0.25) });
  });
}

export function rugRound(color: string): ArtTexture {
  return makeArt(120, 60, 60, 30, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(60, 30, 56, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(60, 30, 44, 20, 0, 0, Math.PI * 2);
    ctx.strokeStyle = shade(color, 0.3);
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

export function lockerRow(): ArtTexture {
  return canvasFor(2, 0.4, 64, (ctx, P) => {
    isoBox(ctx, P, -1, -0.2, 2, 0.4, 0, 56, '#3d6fb6');
    ctx.strokeStyle = '#2a5290';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let u = -1; u <= 1; u += 0.4) {
      ctx.moveTo(...P(u, 0.2, 0));
      ctx.lineTo(...P(u, 0.2, 56));
    }
    ctx.stroke();
    for (let u = -0.85; u < 1; u += 0.4) quad(ctx, [P(u, 0.2, 40), P(u + 0.1, 0.2, 40), P(u + 0.1, 0.2, 42), P(u, 0.2, 42)], '#ffffff');
  });
}

export function stool(color: string): ArtTexture {
  return canvasFor(0.5, 0.5, 26, (ctx, P) => {
    isoBox(ctx, P, -0.06, -0.06, 0.12, 0.12, 0, 12, '#3b3f46');
    isoBox(ctx, P, -0.22, -0.22, 0.44, 0.44, 12, 3, color);
  });
}
