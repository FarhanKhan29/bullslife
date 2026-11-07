/**
 * Small toolkit for describing building interiors as data:
 * a Room collects floor, props (with interactions), wall decorations,
 * a passport stamp and the exit back to campus.
 */
import type { Facing } from '../../character/avatarRenderer';
import type { Collider } from '../iso';
import { BUILDING_BY_ID, doorOutside } from './buildings';
import type { FloorDecor, Ground, InteriorStyle, MapDef, PropAct, WallItem } from './types';

export interface AddOpts {
  /** Collider: rectangle size [w, d] around the prop, a circle radius, or none. */
  rect?: [number, number];
  r?: number;
  act?: PropAct;
  reach?: number;
}

export class Room {
  readonly map: MapDef;
  private style: InteriorStyle;

  constructor(id: string, w: number, h: number, floor: Ground, style: Partial<InteriorStyle> & { items?: WallItem[] }) {
    const b = BUILDING_BY_ID.get(id);
    this.style = {
      wall: '#f2efe8',
      wallSide: '#e4e0d7',
      trim: '#005bbb',
      wallHeight: 120,
      items: [],
      floorDecor: [],
      ...style,
    };
    const ground: Ground[][] = [];
    for (let y = 0; y < h; y++) ground.push(new Array(w).fill(floor));
    const mid = Math.floor(w / 2);
    ground[h - 1][mid - 1] = 'mat';
    ground[h - 1][mid] = 'mat';
    this.map = {
      id,
      name: b?.name ?? id,
      w,
      h,
      ground,
      props: [],
      colliders: [],
      interactables: [],
      triggers: [
        {
          id: 'exit',
          x0: mid - 1,
          y0: h - 0.5,
          x1: mid + 1,
          y1: h,
          action: { type: 'goto', to: 'campus', spawn: b ? doorOutside(b) : { x: 44, y: 36 } },
        },
      ],
      spawn: { x: mid, y: h - 1.6 },
      wallHeight: this.style.wallHeight,
      interior: this.style,
      boards: [],
    };
  }

  floor(x0: number, y0: number, x1: number, y1: number, g: Ground) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (this.map.ground[y]?.[x] && this.map.ground[y][x] !== 'mat') this.map.ground[y][x] = g;
    return this;
  }

  decor(d: FloorDecor) {
    this.style.floorDecor!.push(d);
    return this;
  }

  wall(item: WallItem) {
    this.style.items.push(item);
    return this;
  }

  add(tex: string, gx: number, gy: number, o: AddOpts = {}) {
    let collider: Collider | undefined;
    if (o.rect) collider = { kind: 'rect', x0: gx - o.rect[0] / 2, y0: gy - o.rect[1] / 2, x1: gx + o.rect[0] / 2, y1: gy + o.rect[1] / 2 };
    else if (o.r) collider = { kind: 'circle', x: gx, y: gy, r: o.r };
    this.map.props.push({ tex, gx, gy, collider, act: o.act, reach: o.reach });
    if (collider) this.map.colliders.push(collider);
    return this;
  }

  /** A seat. Facing is the direction the sitter looks. */
  seat(tex: string, gx: number, gy: number, facing: Facing, flip = false) {
    return this.add(tex, gx, gy, { r: 0.22, act: { kind: 'sit', facing, flip }, reach: 0.9 });
  }

  /** Chair north of (x,y) facing south, and one south facing north. */
  chairsNS(x: number, y: number, gap = 0.8, color: 'blue' | 'gold' = 'blue') {
    this.seat(`chair_${color}`, x, y - gap, 'front');
    this.seat(`seatn_${color}`, x, y + gap, 'back');
    return this;
  }

  bed(gx: number, gy: number, blanket: 'blue' | 'red' | 'green' | 'gold' | 'purple', alongX = false) {
    const [w, d] = alongX ? [2, 1] : [1, 2];
    return this.add(`bed_${blanket}${alongX ? '_x' : ''}`, gx, gy, { rect: [w * 0.95, d * 0.95], act: { kind: 'lie' }, reach: 1.4 });
  }

  stamp(gx: number, gy: number, prompt: string, radius = 1.6) {
    this.map.interactables.push({ id: 'stamp-' + this.map.id, gx, gy, radius, prompt, action: { type: 'stamp', stamp: this.map.id } });
    return this;
  }

  info(id: string, gx: number, gy: number, prompt: string, text: string, radius = 1.3) {
    this.map.interactables.push({ id, gx, gy, radius, prompt, action: { type: 'info', text } });
    return this;
  }

  /** Standing whiteboard players can write on (text is shared). */
  board(id: string, gx: number, gy: number) {
    this.add('whiteboard', gx, gy, { rect: [2, 0.3], act: { kind: 'use', use: 'whiteboard', label: 'Write on the whiteboard', board: id }, reach: 1.5 });
    this.map.boards!.push({ id, x: gx, y: gy });
    return this;
  }

  /** Low partition wall from (x0,y0) running `len` tiles along x or y. */
  partition(x0: number, y0: number, len: number, alongX: boolean) {
    for (let i = 0; i < len; i++) {
      const x = alongX ? x0 + i + 0.5 : x0;
      const y = alongX ? y0 : y0 + i + 0.5;
      this.map.props.push({ tex: alongX ? 'partition_x' : 'partition_y', gx: x, gy: y });
    }
    this.map.colliders.push(alongX ? { kind: 'rect', x0, y0: y0 - 0.08, x1: x0 + len, y1: y0 + 0.08 } : { kind: 'rect', x0: x0 - 0.08, y0, x1: x0 + 0.08, y1: y0 + len });
    return this;
  }

  done(): MapDef {
    return this.map;
  }
}
