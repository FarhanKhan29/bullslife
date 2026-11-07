import type { Collider } from '../iso';

export type MapId = 'campus' | 'union';
export type Ground = 'grass' | 'path' | 'plaza' | 'water' | 'garden' | 'wood' | 'rug' | 'tile' | 'mat' | 'booth';

/** A drawable object placed in the world. */
export interface Prop {
  tex: string; // texture key (see Textures)
  gx: number;
  gy: number;
  /** Rectangular footprint for big things (buildings) — enables correct depth sorting. */
  footprint?: { x0: number; y0: number; x1: number; y1: number };
  collider?: Collider;
  label?: string; // floating label (buildings)
  labelHeight?: number; // px above the footprint centre for the label
  depthBias?: number;
}

export type InteractAction =
  | { type: 'enter'; to: MapId; spawn: { x: number; y: number } }
  | { type: 'stamp'; stamp: 'union' | 'capen' | 'davis' }
  | { type: 'info'; text: string }
  | { type: 'photo' };

export interface Interactable {
  id: string;
  gx: number;
  gy: number;
  radius: number;
  prompt: string;
  action: InteractAction;
}

/** Areas that trigger as soon as you walk into them (doors, exits, portals). */
export interface Trigger {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  action: { type: 'goto'; to: MapId; spawn: { x: number; y: number } } | { type: 'teleport'; x: number; y: number; requires?: 'portal' };
}

export interface MapDef {
  id: MapId;
  name: string;
  w: number;
  h: number;
  ground: Ground[][]; // [gy][gx]
  props: Prop[];
  colliders: Collider[];
  interactables: Interactable[];
  triggers: Trigger[];
  spawn: { x: number; y: number };
  /** Extra space above the map for tall walls (interiors). */
  wallHeight?: number;
}
