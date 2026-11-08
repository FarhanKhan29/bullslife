/**
 * Registry of every enterable North Campus building: where it stands on the
 * campus map, where its door is, how it looks, and its passport stamp.
 * The official UB North Campus map guides placement. Grid x points east and y points south.
 */
import type { BuildingSpec } from '../art';
import type { Collider } from '../iso';
import * as ub from '../ubBuildings';

export interface BuildingDef {
  id: string;
  name: string;
  emoji: string;
  color: string; // passport stamp colour
  blurb: string; // what you do here (passport hint)
  x0: number;
  y0: number;
  w: number;
  d: number;
  /** Door on the south ('s') or east ('e') face, `u` tiles from the face start. */
  door: { side: 's' | 'e'; u: number; width?: number };
  ext: () => BuildingSpec;
  /** Texture resolution (big buildings use 1 to save GPU memory). */
  res?: number;
  /** Optional colliders in coordinates relative to the building origin. */
  colliders?: Collider[];
  labelH: number;
  passport?: false;
}

export const BUILDINGS: BuildingDef[] = [
  // ---- core / Academic Spine
  { id: 'union', name: 'Student Union', emoji: '🏛️', color: '#005bbb', blurb: 'Check in at the Information Desk.', x0: 69, y0: 62, w: 9, d: 7, door: { side: 's', u: 5, width: 1.6 }, ext: ub.studentUnion, labelH: 190,
    // round rotunda + back block + west wing + stair tower
    colliders: [
      { kind: 'rect', x0: 0, y0: 0, x1: 6.6, y1: 5.2 },
      { kind: 'rect', x0: 0, y0: 4.6, x1: 2.8, y1: 7 },
      { kind: 'rect', x0: 6.6, y0: 0.2, x1: 9, y1: 1.8 },
      { kind: 'circle', x: 5.6, y: 3.8, r: 3.2 },
    ] },
  { id: 'capen', name: 'Capen Hall', emoji: '📚', color: '#b9785a', blurb: 'Check in at the 1Capen UB Card Office.', x0: 39, y0: 65, w: 10, d: 7, door: { side: 's', u: 3.3, width: 1.1 }, ext: ub.capenHall, labelH: 165 },
  { id: 'lockwood', name: 'Lockwood Library', emoji: '📖', color: '#5e3226', blurb: 'Check in at the second-floor Services Desk.', x0: 68, y0: 77, w: 9, d: 8, door: { side: 'e', u: 3.3 }, ext: ub.lockwoodLibrary, labelH: 150 },
  { id: 'norton', name: 'Norton Hall', emoji: '🎓', color: '#7a4434', blurb: 'Give a lecture at the podium.', x0: 50, y0: 63, w: 7, d: 6, door: { side: 's', u: 2.8 }, ext: ub.nortonHall, labelH: 115 },
  { id: 'talbert', name: 'Talbert Hall', emoji: '✏️', color: '#9a4a36', blurb: 'Visit International Student Services.', x0: 30, y0: 67, w: 7, d: 7, door: { side: 's', u: 2.8 }, ext: ub.talbertHall, labelH: 120 },
  { id: 'baldy', name: 'Baldy Hall', emoji: '💻', color: '#5e3226', blurb: 'Check in at the classroom podium.', x0: 58, y0: 75, w: 8, d: 7, door: { side: 's', u: 3.3 }, ext: ub.baldyHall, labelH: 135 },
  { id: 'clemens', name: 'Clemens Hall', emoji: '🖼️', color: '#7a4434', blurb: 'Visit the humanities seminar room.', x0: 79, y0: 77, w: 7, d: 8, door: { side: 's', u: 2.8 }, ext: ub.clemensHall, labelH: 190 },
  // ---- engineering
  { id: 'davis', name: 'Davis Hall', emoji: '⚙️', color: '#3e7aa8', blurb: 'Meet the robot in the CSE lab.', x0: 57, y0: 37, w: 9, d: 8, door: { side: 's', u: 2.2, width: 1 }, ext: ub.davisHall, labelH: 160 },
  { id: 'bell', name: 'Bell Hall', emoji: '🔧', color: '#8a9bb0', blurb: 'Check in at the engineering lab.', x0: 59, y0: 56, w: 8, d: 7, door: { side: 's', u: 3.3 }, ext: ub.bellHall, labelH: 110 },
  { id: 'furnas', name: 'Furnas Hall', emoji: '📐', color: '#9a4a36', blurb: 'Visit the Materials Characterization Lab.', x0: 59, y0: 47, w: 7, d: 6, door: { side: 's', u: 2.8 }, ext: ub.furnasHall, labelH: 110 },
  { id: 'ketter', name: 'Ketter Hall', emoji: '🏗️', color: '#c9a882', blurb: 'Read the shake-table safety sign.', x0: 48, y0: 42, w: 7, d: 7, door: { side: 'e', u: 4.2 }, ext: ub.ketterHall, labelH: 145 },
  // ---- residence halls
  { id: 'ellicott', name: 'Ellicott Complex', emoji: '🛏️', color: '#9a4a36', blurb: 'Make yourself at home in room 204.', x0: 71, y0: 8, w: 16, d: 14, door: { side: 's', u: 5.3 }, ext: ub.ellicottComplex, res: 1, labelH: 185 },
  { id: 'governors', name: 'Governors', emoji: '🎹', color: '#7a4434', blurb: 'Sign the common-room guest book.', x0: 8, y0: 53, w: 8, d: 8, door: { side: 'e', u: 5.8 }, ext: ub.governorsComplex, labelH: 100 },
  { id: 'greiner', name: 'Greiner Hall', emoji: '🍳', color: '#9a4a36', blurb: 'Visit the Greiner study lounge.', x0: 74, y0: 26, w: 8, d: 7, door: { side: 's', u: 4.8 }, ext: ub.greinerHall, labelH: 125 },
  // ---- sports, arts, food
  { id: 'arena', name: 'Alumni Arena', emoji: '🏀', color: '#005bbb', blurb: 'Check out the trophy case.', x0: 98, y0: 73, w: 12, d: 10, door: { side: 'e', u: 4.3 }, ext: ub.alumniArena, res: 1, labelH: 120 },
  { id: 'stadium', name: 'UB Stadium', emoji: '🏈', color: '#3fae6b', blurb: 'Visit the Bulls ticket booth.', x0: 110, y0: 84, w: 16, d: 12, door: { side: 'e', u: 5.2 }, ext: ub.ubStadium, res: 1, labelH: 120 },
  { id: 'cfa', name: 'Center for the Arts', emoji: '🎭', color: '#7a5cd6', blurb: 'Visit the Atrium information desk.', x0: 90, y0: 63, w: 10, d: 7, door: { side: 's', u: 2.3 }, ext: ub.centerForTheArts, labelH: 115 },
  { id: 'commons', name: 'The Commons', emoji: '🛍️', color: '#d94b4b', blurb: 'Visit the Lee Road retail arcade.', x0: 80, y0: 55, w: 8, d: 6, door: { side: 'e', u: 2.3 }, ext: ub.theCommons, labelH: 80 },
  { id: 'bookstore', name: 'University Bookstore', emoji: '📕', color: '#005bbb', blurb: 'Browse textbooks and UB gear.', x0: 78, y0: 47, w: 7, d: 4, door: { side: 's', u: 2.8 }, ext: ub.bookstore, labelH: 75, passport: false },
  { id: 'crossroads', name: 'Crossroads Culinary', emoji: '🍕', color: '#f2a93b', blurb: 'Check in at the entrance to C3.', x0: 62, y0: 10, w: 8, d: 6, door: { side: 's', u: 3.3 }, ext: ub.crossroads, labelH: 90 },
];

export const BUILDING_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));

/** Point just outside the door (where you appear when leaving a building). */
export function doorOutside(b: BuildingDef): { x: number; y: number } {
  const w = b.door.width ?? 1.4;
  if (b.door.side === 's') return { x: b.x0 + b.door.u + w / 2, y: b.y0 + b.d + 0.75 };
  return { x: b.x0 + b.w + 0.75, y: b.y0 + b.door.u + w / 2 };
}

/** Rectangle you walk into to enter. */
export function doorTrigger(b: BuildingDef) {
  const w = b.door.width ?? 1.4;
  if (b.door.side === 's') return { x0: b.x0 + b.door.u, y0: b.y0 + b.d - 0.3, x1: b.x0 + b.door.u + w, y1: b.y0 + b.d + 0.45 };
  return { x0: b.x0 + b.w - 0.3, y0: b.y0 + b.door.u, x1: b.x0 + b.w + 0.45, y1: b.y0 + b.door.u + w };
}
