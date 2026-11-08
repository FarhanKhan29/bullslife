/** Interiors of the engineering buildings (School of Engineering and Applied Sciences). */
import { Room } from './interiorKit';
import type { MapDef } from './types';

const LAB = { wall: '#eef1f3', wallSide: '#dfe4e8', trim: '#3e7aa8', base: '#9aa3ad' };

/** Davis Hall — CSE labs: robot arm, 3D printers, cleanroom window, atrium beanbags. */
export function davisInterior(): MapDef {
  const r = new Room('davis', 16, 13, 'lino', {
    ...LAB,
    wallHeight: 130,
    items: [
      { wall: 'n', u: 0.8, w: 6, z: 20, h: 70, kind: 'window', color: '#cfe9f5', text: ['CLEANROOM'] },
      { wall: 'n', u: 8, w: 7, z: 96, h: 20, kind: 'sign', color: '#b8784c', text: ['COMPUTER SCIENCE & ENGINEERING'] },
      { wall: 'n', u: 8.5, w: 3, z: 30, h: 50, kind: 'whiteboard' },
      { wall: 'w', u: 1, w: 3, z: 30, h: 40, kind: 'screen', text: ['ROBOTICS LAB', 'demo @ 3pm'] },
      { wall: 'w', u: 6, w: 4, z: 40, h: 40, kind: 'poster', color: '#b8784c', text: ['HACKATHON', 'TONIGHT!'] },
    ],
  });
  r.add('robot_arm', 13.6, 2.4, { r: 0.5, act: { kind: 'use', use: 'robot', label: 'Wave at the robot arm' } });
  r.stamp(13.6, 3.6, 'Meet the robot in the CSE lab', 1.4);
  for (const [x, y] of [
    [3, 4.2],
    [3, 6.8],
    [7.4, 4.2],
    [7.4, 6.8],
  ]) {
    r.add('lab_cs', x, y, { rect: [2, 0.8], act: { kind: 'use', use: 'computer', label: 'Debug some code' } });
    r.seat('stool_blue', x - 0.5, y + 0.75, 'back');
    r.seat('stool_blue', x + 0.5, y + 0.75, 'back');
  }
  r.add('printer3d', 11.4, 4.4, { r: 0.45, act: { kind: 'use', use: 'printer', label: 'Start a 3D print' } });
  r.add('printer3d', 12.8, 4.4, { r: 0.45, act: { kind: 'use', use: 'printer', label: 'Start a 3D print' } });
  r.board('davis-board', 12.4, 7.4);
  r.partition(0, 8.8, 5.7, true).partition(9.4, 8.8, 6.6, true);
  r.floor(0, 9, 16, 13, 'tile');
  r.info('bansal-atrium', 7.8, 10.3, 'Bansal Atrium', 'The public atrium leads to the engineering labs.');
  // atrium lounge
  r.seat('beanbag_orange', 2, 10.4, 'front');
  r.seat('beanbag_blue', 3.4, 11.2, 'front');
  r.seat('beanbag_purple', 12.6, 10.6, 'front');
  r.add('vend_a', 15.3, 10.4, { rect: [1, 0.8], act: { kind: 'checkout', shop: 'snacks', label: 'Buy a snack' } });
  return r.done();
}

/** Bell Hall: industrial and systems engineering classrooms and research. */
export function bellInterior(): MapDef {
  const r = new Room('bell', 16, 12, 'lino', {
    ...LAB, wallHeight: 125,
    items: [
      { wall: 'n', u: 1, w: 13, z: 85, h: 22, kind: 'sign', color: '#345b78', text: ['INDUSTRIAL AND SYSTEMS ENGINEERING'] },
      { wall: 'w', u: 2, w: 5, z: 35, h: 55, kind: 'window' },
    ],
  });
  r.partition(8.3, 0, 7.8, false);
  r.board('bell-board', 4, 2);
  for (const x of [2.3, 5.8]) for (const y of [4.6, 7.3]) {
    r.add('study_table', x, y, { rect: [2, 0.9] });
    r.chairsNS(x, y);
  }
  r.add('lab_cs', 12, 3.5, { rect: [2, 0.8], act: { kind: 'use', use: 'computer', label: 'Review ergonomics data' } });
  r.add('desk_lamp', 12.5, 8.2, { rect: [1.4, 0.7] }).stamp(12.5, 9.2, 'Check in at the engineering lab', 1.2);
  r.info('ergonomics', 12, 5, 'Physical ergonomics research', 'Bell Hall houses Industrial and Systems Engineering research and teaching.');
  return r.done();
}

/** Furnas Hall — Materials Characterization Laboratory and engineering workstations. */
export function furnasInterior(): MapDef {
  const r = new Room('furnas', 14, 12, 'lino', {
    ...LAB,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 5, z: 40, h: 50, kind: 'whiteboard' },
      { wall: 'n', u: 7, w: 6, z: 70, h: 20, kind: 'sign', color: '#9a4a36', text: ['110 FURNAS · MATERIALS LAB'] },
      { wall: 'w', u: 1, w: 3, z: 40, h: 40, kind: 'poster', color: '#3e7aa8', text: ['CAD', 'NIGHT'] },
      { wall: 'w', u: 6, w: 4, z: 30, h: 50, kind: 'window' },
    ],
  });
  for (const [x, y] of [
    [2.6, 3.4],
    [5.2, 3.4],
    [2.6, 6.4],
    [5.2, 6.4],
  ]) {
    r.add('drafting', x, y, { rect: [1.2, 0.9], act: { kind: 'use', use: 'info', label: 'Sketch a design', text: '📐 You sketched a bridge. It might even stand up!' } });
    r.seat('stool_blue', x, y + 0.9, 'back');
  }
  r.add('lab_micro', 10.6, 2.8, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Inspect a materials sample' } });
  r.stamp(10.6, 4, 'Check in at the Materials Characterization Lab', 1.2);
  r.add('desk_pc', 10.8, 6.4, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Open the CAD model' } });
  r.seat('seatn_blue', 10.8, 7.15, 'back');
  r.add('plant', 13.2, 11.2, { r: 0.3 });
  return r.done();
}

/** Ketter Hall — structures lab with the earthquake shake table. */
export function ketterInterior(): MapDef {
  const r = new Room('ketter', 16, 12, 'concrete', {
    ...LAB,
    trim: '#c9a882',
    wallHeight: 140,
    items: [
      { wall: 'n', u: 2, w: 10, z: 100, h: 22, kind: 'sign', color: '#2b2f38', text: ['STRUCTURAL ENGINEERING & EARTHQUAKE SIMULATION LAB'] },
      { wall: 'n', u: 12.5, w: 3, z: 30, h: 60, kind: 'window' },
      { wall: 'w', u: 1, w: 4, z: 40, h: 46, kind: 'screen', text: ['SHAKE TEST', 'magnitude 6.7'] },
      { wall: 'w', u: 7, w: 3, z: 6, h: 60, kind: 'lockers' },
    ],
  });
  r.add('shake_table', 7, 4.6, { rect: [3, 3], act: { kind: 'use', use: 'shake', label: 'Start an earthquake test' }, reach: 2.4 });
  r.add('shake_table', 3, 3, { rect: [2.6, 2.6], act: { kind: 'use', use: 'shake', label: 'Start the second shake table' }, reach: 2.1 });
  r.stamp(7, 6.9, 'Read the shake-table safety sign', 1.1);
  r.add('lab_micro', 12.6, 3, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Inspect a concrete sample' } });
  r.add('desk_pc', 12.6, 6.2, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Check the sensor data' } });
  r.seat('seatn_blue', 12.6, 6.95, 'back');
  r.board('ketter-board', 3, 8.8);
  r.seat('stool_red', 2.4, 10, 'back');
  r.seat('stool_red', 3.6, 10, 'back');
  return r.done();
}
