import type { Facing } from '../../character/avatarRenderer';
import type { Collider } from '../iso';

/** 'campus' or a building id (each building's interior is its own map). */
export type MapId = string;

export type Ground =
  | 'grass'
  | 'path'
  | 'plaza'
  | 'water'
  | 'garden'
  | 'wood'
  | 'rug'
  | 'tile'
  | 'mat'
  | 'booth'
  | 'carpet'
  | 'court'
  | 'turf'
  | 'lino'
  | 'concrete'
  | 'stage'
  | 'darkwood';

/** Things you can hold (eat & drink, sports balls, books). */
export type ItemId = 'coffee' | 'tea' | 'pizza' | 'burger' | 'salad' | 'sandwich' | 'soda' | 'chips' | 'icecream' | 'book' | 'basketball' | 'football' | 'noodles' | 'wings';

export type UseKind =
  | 'book'
  | 'computer'
  | 'whiteboard'
  | 'hoop'
  | 'piano'
  | 'lights'
  | 'shake'
  | 'printer'
  | 'tv'
  | 'kick'
  | 'laundry'
  | 'pingpong'
  | 'microscope'
  | 'robot'
  | 'easel'
  | 'drums'
  | 'shop'
  | 'info';

/** What happens when you press E next to a prop. */
export type PropAct =
  | { kind: 'sit'; facing: Facing; flip?: boolean }
  | { kind: 'lie' }
  | { kind: 'eat'; item: ItemId; label: string; text: string }
  | { kind: 'use'; use: UseKind; label: string; text?: string; target?: { x: number; y: number }; board?: string };

/** A drawable object placed in the world. */
export interface Prop {
  tex: string;
  gx: number;
  gy: number;
  /** Rectangular footprint for big things (buildings) — enables correct depth sorting. */
  footprint?: { x0: number; y0: number; x1: number; y1: number };
  collider?: Collider;
  label?: string;
  labelHeight?: number;
  depthBias?: number;
  act?: PropAct;
  /** How close you must be to use it (tiles). */
  reach?: number;
}

export type InteractAction =
  | { type: 'stamp'; stamp: string }
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
  action: { type: 'goto'; to: MapId; spawn?: { x: number; y: number } } | { type: 'teleport'; x: number; y: number; requires?: 'portal' };
}

/** Decoration painted on an interior's back walls. */
export interface WallItem {
  wall: 'n' | 'w'; // north wall runs along x (at y=0); west wall runs along y (at x=0)
  u: number; // start position along the wall (tiles)
  w: number; // width along the wall (tiles)
  z: number; // bottom height (px)
  h: number; // height (px)
  kind: 'window' | 'banner' | 'board' | 'whiteboard' | 'chalk' | 'screen' | 'shelf' | 'tv' | 'scoreboard' | 'art' | 'door' | 'lockers' | 'menu' | 'sign' | 'clock' | 'trophy' | 'mirror' | 'poster';
  color?: string;
  text?: string[];
}

export type FloorDecor =
  | { kind: 'seal'; x: number; y: number; r: number }
  | { kind: 'court'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'field'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'rug'; x0: number; y0: number; x1: number; y1: number; color: string; border: string }
  | { kind: 'stage'; x0: number; y0: number; x1: number; y1: number };

export interface InteriorStyle {
  wall: string; // north wall colour
  wallSide: string; // west wall colour
  trim: string; // top trim colour
  base?: string; // wainscot / skirting colour
  wallHeight: number;
  items: WallItem[];
  floorDecor?: FloorDecor[];
  balcony?: boolean; // Student Union atrium balcony
  stairs?: boolean;
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
  interior?: InteriorStyle;
  /** Whiteboards whose text players can write (shared over the network). */
  boards?: { id: string; x: number; y: number }[];
}
