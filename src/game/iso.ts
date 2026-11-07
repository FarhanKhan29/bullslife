/**
 * Isometric math. The world is a grid; (gx, gy) are continuous grid coordinates.
 * Tile (i, j) covers [i, i+1) x [j, j+1). Screen = classic 2:1 diamond projection.
 */
import { TILE_W, TILE_H } from '../core/config';

const HW = TILE_W / 2;
const HH = TILE_H / 2;

export function isoToScreen(gx: number, gy: number): { x: number; y: number } {
  return { x: (gx - gy) * HW, y: (gx + gy) * HH };
}

export function screenToIso(x: number, y: number): { gx: number; gy: number } {
  return { gx: (x / HW + y / HH) / 2, gy: (y / HH - x / HW) / 2 };
}

/**
 * Converts a SCREEN-space direction (right/down) into a GRID-space velocity so
 * pressing W always moves the avatar up the screen.
 */
export function screenDirToGrid(vx: number, vy: number): { dx: number; dy: number } {
  return { dx: (vx / HW + vy / HH) / 2, dy: (vy / HH - vx / HW) / 2 };
}

/** Depth used for painter's-algorithm sorting: things further "south" draw on top. */
export function depthOf(gx: number, gy: number): number {
  return (gx + gy) * 10;
}

export type Collider =
  | { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'circle'; x: number; y: number; r: number };

/** Does a circle (player) at (x, y) with radius r overlap the collider? */
export function hits(c: Collider, x: number, y: number, r: number): boolean {
  if (c.kind === 'circle') {
    const dx = x - c.x;
    const dy = y - c.y;
    return dx * dx + dy * dy < (r + c.r) * (r + c.r);
  }
  const nx = Math.max(c.x0, Math.min(x, c.x1));
  const ny = Math.max(c.y0, Math.min(y, c.y1));
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy < r * r;
}

/**
 * Moves a circle through the world, sliding along walls (x then y axis).
 * Returns the resolved position.
 */
export function moveWithCollision(
  x: number,
  y: number,
  dx: number,
  dy: number,
  r: number,
  colliders: Collider[],
  bounds: { w: number; h: number },
): { x: number; y: number } {
  const blocked = (px: number, py: number) =>
    px - r < 0 || py - r < 0 || px + r > bounds.w || py + r > bounds.h || colliders.some((c) => hits(c, px, py, r));
  let nx = x + dx;
  if (blocked(nx, y)) nx = x;
  let ny = y + dy;
  if (blocked(nx, ny)) ny = y;
  return { x: nx, y: ny };
}

/**
 * Large footprints (buildings) cannot be sorted by a single depth value.
 * Given a point and a rectangular footprint, decide whether the point is in
 * front of it (south or east side) — used to place avatars above/below buildings.
 */
export function isInFrontOf(px: number, py: number, f: { x0: number; y0: number; x1: number; y1: number }): boolean {
  return px >= f.x1 || py >= f.y1;
}
