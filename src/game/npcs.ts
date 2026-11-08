/**
 * Non-player characters: teachers, staff and students who chat with each other.
 * They are local decoration on each client: never counted as online players,
 * never sent over the network, and their name tags use their own colour.
 */
import { CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, PANTS_COLORS, SHOE_COLORS, SKIN_TONES, type Appearance } from '../character/appearance';
import { rng } from './art';
import { hits } from './iso';
import type { MapDef } from './maps/types';

export interface NpcDef {
  id: string;
  name: string; // shown on the name tag
  look: Appearance;
  x: number;
  y: number;
  route?: { x: number; y: number }[]; // walkers pace back and forth along this
  lines: string[]; // what they say when you talk to them
}

export interface NpcGroup {
  members: NpcDef[];
  /** Conversations: each entry is a list of lines; speakers take turns. */
  talks: string[][];
}

type Kind = 'student' | 'prof' | 'staff' | 'coach' | 'chef';

function lookFor(kind: Kind, seed: number, name: string): Appearance {
  const r = rng(seed * 7919 + 13);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const student = kind === 'student';
  const hair = pick(HAIR_STYLES);
  return {
    name,
    hair: kind === 'prof' && r() < 0.3 ? 'bald' : hair,
    hairColor: kind === 'prof' ? pick(['#9aa3ad', '#5a3825', '#2b1d16']) : pick(HAIR_COLORS.slice(0, 6)),
    skin: pick(SKIN_TONES),
    top: kind === 'prof' ? 'jacket' : kind === 'coach' ? 'varsity' : student ? pick(['tshirt', 'hoodie', 'varsity', 'jacket'] as const) : 'tshirt',
    topColor: kind === 'chef' ? '#ffffff' : kind === 'coach' ? '#005bbb' : kind === 'prof' ? pick(['#6b4f3a', '#2b2f38', '#8a9bb0']) : pick(CLOTH_COLORS),
    pants: kind === 'prof' ? 'jeans' : student ? pick(['jeans', 'joggers', 'shorts', 'skirt'] as const) : 'joggers',
    pantsColor: pick(PANTS_COLORS),
    shoes: pick(['sneakers', 'boots', 'hightops'] as const),
    shoesColor: pick(SHOE_COLORS),
    backpack: student ? pick(['classic', 'sling', 'none'] as const) : 'none',
    glasses: kind === 'prof' ? pick(['round', 'square'] as const) : r() < 0.25 ? 'round' : 'none',
    hat: kind === 'coach' ? 'cap' : student && r() < 0.3 ? pick(['beanie', 'cap'] as const) : 'none',
    accessory: kind === 'staff' || kind === 'prof' ? 'lanyard' : student && r() < 0.3 ? pick(['headphones', 'scarf'] as const) : 'none',
    accentColor: pick(CLOTH_COLORS),
  };
}

const STUDENT_NAMES = ['Maya', 'Devon', 'Aisha', 'Luis', 'Hannah', 'Kofi', 'Mei', 'Tyler', 'Zara', 'Noah', 'Sofia', 'Omar', 'Grace', 'Ethan', 'Nina', 'Jamal', 'Chloe', 'Ravi', 'Ivy', 'Marcus', 'Lena', 'Andre', 'Tara', 'Ben', 'Priya', 'Caleb', 'Yuki', 'Diego', 'Amara', 'Felix'];
const nameAt = (i: number) => STUDENT_NAMES[i % STUDENT_NAMES.length];

const TALK: Record<string, string[][]> = {
  campus: [
    ['Did you finish the problem set?', 'Finish? I found the first page.', 'Library at 8 then?', 'Only if there is coffee.'],
    ['Is it supposed to snow today?', "It's Buffalo. Yes.", 'It was sunny an hour ago!', 'Exactly.'],
    ['Those geese chased me again.', 'They own this campus.', 'One of them hissed at my laptop.', 'Respect the geese.'],
    ['Going to the game Saturday?', 'Obviously. Go Bulls!', 'Horns up! 🐂', 'Horns up!'],
    ['I got lost in the Spine again.', 'Which floor?', "I don't even know.", 'Welcome to UB.'],
  ],
  food: [
    ['Wings or pizza?', 'Why choose?', 'My meal swipes say I must.', 'Your meal swipes are wrong.'],
    ['Blue cheese or ranch?', 'Say ranch and we are done here.', 'Blue cheese. Obviously.', 'Good. You may sit.'],
    ['Is the line always this long?', 'Only when you are hungry.'],
  ],
  library: [
    ['Shh, finals are coming.', 'They are still six weeks away!', 'Shh.'],
    ['Do you know where the poetry collection is?', 'Follow the quiet crying.'],
    ['How long have you been here?', 'What day is it?'],
  ],
  lab: [
    ['Did your code compile?', 'Yes! It just does not run.', 'Progress.'],
    ['Who left the robot on?', 'It left itself on.', 'That is not comforting.'],
    ['Your bridge model held?', 'For almost nine seconds!', 'A new record.'],
  ],
  class: [
    ['Is this on the exam?', 'Everything is on the exam.', 'Even the syllabus?', 'Especially the syllabus.'],
    ['Did you do the reading?', 'I read the title.', 'That is more than me.'],
    ['Office hours today?', 'Yes, and bring questions this time!'],
  ],
  dorm: [
    ['Who took my laundry out?', 'It was done an hour ago.', 'It was still damp!', 'Then it was almost done.'],
    ['Movie night in the lounge?', 'Only if we pick in under an hour.'],
    ['Quiet hours started.', 'This IS my quiet voice.'],
  ],
  sports: [
    ['Nice shot!', 'I was aiming for the other hoop.', 'Still counts.'],
    ['Run it again!', 'Coach, my legs are gone.', 'Then run without them!'],
    ['Are we winning?', 'Spiritually.'],
  ],
  office: [
    ['Professor, is the curve generous?', 'The curve is a state of mind.', 'So that is a no?', 'See you Thursday.'],
    ['Can I get an extension?', 'What happened?', 'My laptop, my dog, and also Buffalo.', 'Friday. Final offer.'],
    ['I loved your lecture!', 'Which part?', 'The... beginning part.', 'You were asleep, weren’t you?'],
  ],
  staffchat: [
    ['Excuse me, where is Capen?', 'Straight down the Spine, on your left.', 'And if I get lost?', 'Everyone does. Follow the coffee smell.'],
    ['Did you lose your UB Card again?', 'Third time this month.', 'We should name a desk after you.'],
  ],
  coachtalk: [
    ['Coach, can I skip practice?', 'Do you have a fever?', 'Calculus.', 'Laps. Now.'],
    ['How do we look for Saturday?', 'Like Bulls. Horns up!'],
  ],
  arts: [
    ['Five minutes to curtain!', 'I forgot my first line.', 'What is it?', '"I forgot my line."'],
    ['What does this painting mean?', 'It means the artist needed three credits.'],
  ],
  bus: [
    ['When is the next Stampede?', 'The sign says two minutes.', 'It said that ten minutes ago.'],
    ['North to South?', 'Yep. Grab a seat if you can.'],
  ],
};

const SAY: Record<string, string[]> = {
  student: ['Hey! Have you found the Secret Garden yet?', 'Try the wings at Crossroads.', 'Watch out for the geese.', 'Go Bulls! 🐂', 'Have you collected all your passport stamps?'],
  prof: ['My office hours are open. Please come.', 'Remember: cite your sources.', 'The exam is cumulative.', 'Good question. Ask me again in class.'],
  staff: ['Welcome! Let me know if you need anything.', 'Your UB Card works here.', 'Have a great day on campus!'],
  coach: ['Hustle! Hustle!', 'Horns up!', 'Hydrate and hit the court.'],
  chef: ['Today’s special is extra saucy.', 'Careful, the wings are hot.', 'Enjoy your meal!'],
};

/** Fixed spots outside; first number is the theme, then member positions. */
const CAMPUS_GROUPS: { theme: string; at: [number, number][]; lead?: [string, Kind] }[] = [
  { theme: 'campus', at: [[79.4, 71.2], [80.7, 71.7]] },
  { theme: 'office', at: [[43.8, 73.6], [45.1, 74], [44.4, 74.8]], lead: ['Prof. Whitfield', 'prof'] },
  { theme: 'staffchat', at: [[73.4, 71], [74.7, 71.4]], lead: ['Pat (Campus Tours)', 'staff'] },
  { theme: 'campus', at: [[80, 22.5], [81.3, 22.8]] },
  { theme: 'office', at: [[60, 45.4], [61.3, 45.5]], lead: ['Prof. Ibrahim', 'prof'] },
  { theme: 'food', at: [[89.5, 56.4], [90.6, 56.9]], lead: ['Chef Nora', 'chef'] },
  { theme: 'arts', at: [[93.2, 72], [94.4, 72.5]] },
  { theme: 'coachtalk', at: [[111, 78], [112.2, 78.4]], lead: ['Coach Brooks', 'coach'] },
  { theme: 'dorm', at: [[74, 22.5], [75.3, 22.8]] },
  { theme: 'bus', at: [[68.6, 89.7], [67.4, 89.8]] },
];

const CAMPUS_WALKERS: { kind: Kind; name?: string; route: [number, number][] }[] = [
  { kind: 'student', route: [[38, 73.6], [79, 73.6]] },
  { kind: 'prof', name: 'Prof. Okafor', route: [[47, 74.4], [63.5, 74.4]] },
  { kind: 'student', route: [[72, 24], [72, 50]] },
  { kind: 'student', route: [[30, 55.4], [78, 55.4]] },
  { kind: 'staff', name: 'Campus Staff', route: [[62, 85.5], [96, 85.5]] },
  { kind: 'student', route: [[56, 42], [56, 56]] },
];

/** Who works in each building, and what people there talk about. */
const INDOORS: Record<string, { theme: string; staff?: [string, Kind] }> = {
  union: { theme: 'campus', staff: ['Dana (Info Desk)', 'staff'] },
  capen: { theme: 'library', staff: ['Ms. Rivera (UB Card Office)', 'staff'] },
  silverman: { theme: 'library', staff: ['Mr. Kowalski (Librarian)', 'staff'] },
  lockwood: { theme: 'library', staff: ['Dr. Patel (Archivist)', 'prof'] },
  norton: { theme: 'class', staff: ['Prof. Adeyemi', 'prof'] },
  knox: { theme: 'class', staff: ['Prof. Lindqvist', 'prof'] },
  talbert: { theme: 'class', staff: ['Ms. Nguyen (Tutor)', 'staff'] },
  baldy: { theme: 'class', staff: ['Prof. Haddad', 'prof'] },
  clemens: { theme: 'arts', staff: ['Prof. Moreau', 'prof'] },
  davis: { theme: 'lab', staff: ['Prof. Zhang', 'prof'] },
  bell: { theme: 'lab', staff: ['Prof. Santos', 'prof'] },
  furnas: { theme: 'lab', staff: ['Mr. Bianchi (Lab Tech)', 'staff'] },
  ketter: { theme: 'lab', staff: ['Dr. Yamamoto', 'prof'] },
  cooke: { theme: 'lab', staff: ['Dr. Reyes (Lab TA)', 'prof'] },
  hochstetter: { theme: 'lab', staff: ['Dr. Novak', 'prof'] },
  ellicott: { theme: 'dorm', staff: ['Jordan (RA)', 'staff'] },
  governors: { theme: 'dorm', staff: ['Sam (RA)', 'staff'] },
  greiner: { theme: 'dorm', staff: ['Priya (RA)', 'staff'] },
  arena: { theme: 'sports', staff: ['Coach Davis', 'coach'] },
  stadium: { theme: 'sports', staff: ['Coach Miller', 'coach'] },
  cfa: { theme: 'arts', staff: ['Ms. Laurent (Theatre)', 'staff'] },
  commons: { theme: 'food', staff: ['Alex (Store Clerk)', 'staff'] },
  bookstore: { theme: 'library', staff: ['Riley (Bookstore)', 'staff'] },
  crossroads: { theme: 'food', staff: ['Chef Tony', 'chef'] },
  'union-dining': { theme: 'food', staff: ['Chef Marco', 'chef'] },
  'ellicott-food': { theme: 'food', staff: ['Chef Rosa', 'chef'] },
  'governors-dining': { theme: 'food', staff: ['Chef Lee', 'chef'] },
};

/** Nearest open spot to (x, y): interior furniture layouts can change, so never hard-code. */
export function findFree(map: MapDef, x: number, y: number): { x: number; y: number } {
  const ok = (px: number, py: number) => px > 0.9 && py > 0.9 && px < map.w - 0.9 && py < map.h - 1.8 && !map.colliders.some((c) => hits(c, px, py, 0.4));
  if (ok(x, y)) return { x, y };
  for (let r = 0.4; r < 9; r += 0.4) {
    for (let a = 0; a < 16; a++) {
      const px = x + Math.cos((a / 16) * Math.PI * 2) * r;
      const py = y + Math.sin((a / 16) * Math.PI * 2) * r;
      if (ok(px, py)) return { x: px, y: py };
    }
  }
  return { x: map.spawn.x, y: map.spawn.y };
}

/** All NPC groups for a map. A group of one just has no conversations. */
export function npcsFor(map: MapDef): NpcGroup[] {
  const groups: NpcGroup[] = [];
  let n = 0;
  const seedBase = [...map.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const make = (kind: Kind, x: number, y: number, name?: string, route?: { x: number; y: number }[]): NpcDef => {
    const i = n++;
    const shown = name ?? nameAt(seedBase + i);
    return { id: `${map.id}-${i}`, name: shown, look: lookFor(kind, seedBase + i, shown), x, y, route, lines: SAY[kind] };
  };
  if (map.id === 'campus') {
    for (const g of CAMPUS_GROUPS) {
      // the student speaks first, so in mixed groups the teacher answers
      const members = g.at.map(([x, y], i) => (g.lead && i === 1 ? make(g.lead[1], x, y, g.lead[0]) : make('student', x, y)));
      groups.push({ members, talks: TALK[g.theme] });
    }
    for (const w of CAMPUS_WALKERS) {
      const route = w.route.map(([x, y]) => ({ x, y }));
      groups.push({ members: [make(w.kind, route[0].x, route[0].y, w.name, route)], talks: [] });
    }
    return groups;
  }
  const info = INDOORS[map.id];
  if (!info) return groups;
  const stamp = map.interactables.find((i) => i.action.type === 'stamp');
  if (info.staff) {
    const at = findFree(map, (stamp?.gx ?? map.w / 2) + 1.2, (stamp?.gy ?? 3) + 0.3);
    groups.push({ members: [make(info.staff[1], at.x, at.y, info.staff[0])], talks: [] });
  }
  const a = findFree(map, map.w * 0.62, map.h * 0.58);
  const b = findFree(map, a.x + 1.2, a.y + 0.3);
  groups.push({ members: [make('student', a.x, a.y), make('student', b.x, b.y)], talks: TALK[info.theme] });
  return groups;
}
