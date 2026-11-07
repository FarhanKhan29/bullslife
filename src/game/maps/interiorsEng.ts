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
  // atrium lounge
  r.seat('beanbag_orange', 2, 10.4, 'front');
  r.seat('beanbag_blue', 3.4, 11.2, 'front');
  r.seat('beanbag_purple', 12.6, 10.6, 'front');
  r.add('vend_a', 15.3, 10.4, { rect: [1, 0.8], act: { kind: 'eat', item: 'chips', label: 'Buy a snack', text: 'Hackathon fuel acquired. 🍟' } });
  return r.done();
}

/** Bell Hall — machine shop: lathes, workbench, lockers. */
export function bellInterior(): MapDef {
  const r = new Room('bell', 15, 12, 'concrete', {
    ...LAB,
    wallHeight: 130,
    items: [
      { wall: 'n', u: 1, w: 6, z: 70, h: 22, kind: 'sign', color: '#f2c94c', text: ['⚠ SAFETY GLASSES REQUIRED'] },
      { wall: 'n', u: 8, w: 6, z: 20, h: 70, kind: 'window' },
      { wall: 'w', u: 1, w: 5, z: 6, h: 60, kind: 'lockers' },
      { wall: 'w', u: 7, w: 3, z: 40, h: 30, kind: 'board' },
    ],
  });
  r.add('desk_lamp', 12.4, 9.4, { rect: [1.4, 0.7] }).stamp(12.4, 10.3, 'Get your shop safety sign-off', 1.2);
  for (const [x, y] of [
    [3.2, 2.6],
    [3.2, 5],
    [7.6, 2.6],
  ])
    r.add('lathe', x, y, { rect: [1.8, 0.7], act: { kind: 'use', use: 'info', label: 'Run the lathe', text: '⚙️ Whirrr… you turned a perfect aluminium part.' } });
  r.add('lab_micro', 7.6, 5.2, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Inspect a part' } });
  r.add('robot_arm', 12, 4, { r: 0.5, act: { kind: 'use', use: 'robot', label: 'Program the welding robot' } });
  r.add('lockers', 3.4, 9.6, { rect: [2, 0.4] });
  r.seat('stool_red', 6.6, 8.6, 'side');
  r.seat('stool_red', 8, 8.6, 'side', true);
  return r.done();
}

/** Furnas Hall — engineering design studio: drafting tables and 3D printers. */
export function furnasInterior(): MapDef {
  const r = new Room('furnas', 14, 12, 'lino', {
    ...LAB,
    wallHeight: 120,
    items: [
      { wall: 'n', u: 1, w: 5, z: 40, h: 50, kind: 'whiteboard' },
      { wall: 'n', u: 7, w: 6, z: 70, h: 20, kind: 'sign', color: '#9a4a36', text: ['DESIGN STUDIO'] },
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
  r.add('printer3d', 10, 2.6, { r: 0.45, act: { kind: 'use', use: 'printer', label: 'Start a 3D print' } });
  r.stamp(10, 3.6, 'Pick up your 3D print', 1.2);
  r.add('printer3d', 11.6, 2.6, { r: 0.45, act: { kind: 'use', use: 'printer', label: 'Start a 3D print' } });
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
  r.stamp(7, 6.9, 'Read the shake-table safety sign', 1.1);
  r.add('lab_micro', 12.6, 3, { rect: [2, 0.8], act: { kind: 'use', use: 'microscope', label: 'Inspect a concrete sample' } });
  r.add('desk_pc', 12.6, 6.2, { rect: [1.4, 0.7], act: { kind: 'use', use: 'computer', label: 'Check the sensor data' } });
  r.seat('seatn_blue', 12.6, 6.95, 'back');
  r.board('ketter-board', 3, 8.8);
  r.seat('stool_red', 2.4, 10, 'back');
  r.seat('stool_red', 3.6, 10, 'back');
  return r.done();
}
