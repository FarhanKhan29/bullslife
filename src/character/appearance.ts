/**
 * Character appearance data model.
 * An appearance is a small JSON object of option ids + colors. It is saved to
 * localStorage and sent to other players, so EVERYTHING received from the
 * network is validated with `sanitizeAppearance` before use.
 */
import { loadJSON, saveJSON } from '../core/storage';

export const HAIR_STYLES = ['short', 'buzz', 'long', 'bun', 'curly', 'ponytail', 'spiky', 'bald'] as const;
export const TOPS = ['tshirt', 'hoodie', 'jacket', 'varsity'] as const;
export const PANTS = ['jeans', 'joggers', 'shorts', 'skirt'] as const;
export const SHOES = ['sneakers', 'boots', 'hightops'] as const;
export const BACKPACKS = ['none', 'classic', 'sling'] as const;
export const GLASSES = ['none', 'round', 'square', 'shades'] as const;
export const HATS = ['none', 'beanie', 'cap', 'bucket'] as const;
export const ACCESSORIES = ['none', 'scarf', 'headphones', 'lanyard'] as const;

export const SKIN_TONES = ['#ffe0c7', '#f6c9a0', '#e3a878', '#c68a5b', '#9a6440', '#6b4128'];
export const HAIR_COLORS = ['#2b1d16', '#5a3825', '#a0662f', '#e0b75a', '#d9662b', '#9aa3ad', '#2f4bd6', '#e86aa6'];
export const CLOTH_COLORS = [
  '#005bbb', // UB blue
  '#ffffff',
  '#2b2f38',
  '#d94b4b',
  '#f2a93b',
  '#3fae6b',
  '#7a5cd6',
  '#ff8fb1',
  '#8a9bb0',
  '#6b4f3a',
];
export const PANTS_COLORS = ['#2f4f86', '#1f2430', '#6b5a48', '#9aa3ad', '#c9b48f', '#5b3a6e', '#2e5e4e', '#a33b3b'];
export const SHOE_COLORS = ['#f4f4f4', '#222631', '#d94b4b', '#005bbb', '#a0662f', '#f2c94c'];

export type HairStyle = (typeof HAIR_STYLES)[number];
export type Top = (typeof TOPS)[number];
export type Pants = (typeof PANTS)[number];
export type Shoes = (typeof SHOES)[number];
export type Backpack = (typeof BACKPACKS)[number];
export type Glasses = (typeof GLASSES)[number];
export type Hat = (typeof HATS)[number];
export type Accessory = (typeof ACCESSORIES)[number];

export interface Appearance {
  name: string;
  hair: HairStyle;
  hairColor: string;
  skin: string;
  top: Top;
  topColor: string;
  pants: Pants;
  pantsColor: string;
  shoes: Shoes;
  shoesColor: string;
  backpack: Backpack;
  glasses: Glasses;
  hat: Hat;
  accessory: Accessory;
  accentColor: string; // backpack / hat / scarf color
}

export const PRESETS: { label: string; look: Omit<Appearance, 'name'> }[] = [
  {
    label: 'Go Bulls',
    look: { hair: 'short', hairColor: HAIR_COLORS[1], skin: SKIN_TONES[2], top: 'varsity', topColor: '#005bbb', pants: 'jeans', pantsColor: PANTS_COLORS[0], shoes: 'sneakers', shoesColor: '#f4f4f4', backpack: 'classic', glasses: 'none', hat: 'cap', accessory: 'none', accentColor: '#ffffff' },
  },
  {
    label: 'Cozy Coder',
    look: { hair: 'curly', hairColor: HAIR_COLORS[0], skin: SKIN_TONES[4], top: 'hoodie', topColor: '#7a5cd6', pants: 'joggers', pantsColor: PANTS_COLORS[1], shoes: 'hightops', shoesColor: '#d94b4b', backpack: 'sling', glasses: 'square', hat: 'none', accessory: 'headphones', accentColor: '#2b2f38' },
  },
  {
    label: 'Winter Walk',
    look: { hair: 'long', hairColor: HAIR_COLORS[3], skin: SKIN_TONES[0], top: 'jacket', topColor: '#d94b4b', pants: 'jeans', pantsColor: PANTS_COLORS[1], shoes: 'boots', shoesColor: '#a0662f', backpack: 'none', glasses: 'none', hat: 'beanie', accessory: 'scarf', accentColor: '#f2a93b' },
  },
  {
    label: 'Lab Life',
    look: { hair: 'bun', hairColor: HAIR_COLORS[2], skin: SKIN_TONES[1], top: 'tshirt', topColor: '#ffffff', pants: 'skirt', pantsColor: PANTS_COLORS[5], shoes: 'sneakers', shoesColor: '#005bbb', backpack: 'classic', glasses: 'round', hat: 'none', accessory: 'lanyard', accentColor: '#005bbb' },
  },
  {
    label: 'Sunny Day',
    look: { hair: 'ponytail', hairColor: HAIR_COLORS[4], skin: SKIN_TONES[3], top: 'tshirt', topColor: '#f2a93b', pants: 'shorts', pantsColor: PANTS_COLORS[4], shoes: 'sneakers', shoesColor: '#f4f4f4', backpack: 'sling', glasses: 'shades', hat: 'bucket', accessory: 'none', accentColor: '#3fae6b' },
  },
  {
    label: 'Night Owl',
    look: { hair: 'spiky', hairColor: HAIR_COLORS[6], skin: SKIN_TONES[5], top: 'hoodie', topColor: '#2b2f38', pants: 'joggers', pantsColor: PANTS_COLORS[6], shoes: 'hightops', shoesColor: '#f2c94c', backpack: 'classic', glasses: 'none', hat: 'none', accessory: 'headphones', accentColor: '#ff8fb1' },
  },
];

const NAME_WORDS_A = ['Happy', 'Swift', 'Cozy', 'Brave', 'Sunny', 'Clever', 'Chill', 'Bright'];
const NAME_WORDS_B = ['Bull', 'Owl', 'Fox', 'Otter', 'Panda', 'Comet', 'Maple', 'Falcon'];

export function randomName(): string {
  const a = NAME_WORDS_A[Math.floor(Math.random() * NAME_WORDS_A.length)];
  const b = NAME_WORDS_B[Math.floor(Math.random() * NAME_WORDS_B.length)];
  return `${a}${b}${Math.floor(Math.random() * 90 + 10)}`;
}

/**
 * Nicknames: letters, numbers, spaces, _ - . only; 2–16 chars.
 * Exported for tests.
 */
export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Guest';
  const cleaned = raw
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} _.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return cleaned.length >= 2 ? cleaned : 'Guest';
}

function pick<T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T[number]) : fallback;
}

function pickColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : fallback;
}

/** Validate an untrusted appearance (from storage or the network). */
export function sanitizeAppearance(raw: unknown): Appearance {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = defaultAppearance();
  return {
    name: sanitizeName(r.name ?? d.name),
    hair: pick(HAIR_STYLES, r.hair, d.hair),
    hairColor: pickColor(r.hairColor, d.hairColor),
    skin: pickColor(r.skin, d.skin),
    top: pick(TOPS, r.top, d.top),
    topColor: pickColor(r.topColor, d.topColor),
    pants: pick(PANTS, r.pants, d.pants),
    pantsColor: pickColor(r.pantsColor, d.pantsColor),
    shoes: pick(SHOES, r.shoes, d.shoes),
    shoesColor: pickColor(r.shoesColor, d.shoesColor),
    backpack: pick(BACKPACKS, r.backpack, d.backpack),
    glasses: pick(GLASSES, r.glasses, d.glasses),
    hat: pick(HATS, r.hat, d.hat),
    accessory: pick(ACCESSORIES, r.accessory, d.accessory),
    accentColor: pickColor(r.accentColor, d.accentColor),
  };
}

export function defaultAppearance(): Appearance {
  return { name: 'Guest', ...PRESETS[0].look };
}

export function randomAppearance(name?: string): Appearance {
  const r = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    name: name ?? randomName(),
    hair: r(HAIR_STYLES),
    hairColor: r(HAIR_COLORS),
    skin: r(SKIN_TONES),
    top: r(TOPS),
    topColor: r(CLOTH_COLORS),
    pants: r(PANTS),
    pantsColor: r(PANTS_COLORS),
    shoes: r(SHOES),
    shoesColor: r(SHOE_COLORS),
    backpack: r(BACKPACKS),
    glasses: Math.random() < 0.5 ? 'none' : r(GLASSES),
    hat: Math.random() < 0.5 ? 'none' : r(HATS),
    accessory: Math.random() < 0.5 ? 'none' : r(ACCESSORIES),
    accentColor: r(CLOTH_COLORS),
  };
}

/** Stable short key for caching rendered textures of an appearance. */
export function appearanceKey(a: Appearance): string {
  const { name: _n, ...look } = a;
  const s = JSON.stringify(look);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'av_' + (h >>> 0).toString(36);
}

const STORAGE_KEY = 'bl.appearance';

export function loadAppearance(): { appearance: Appearance; isNew: boolean } {
  const raw = loadJSON<unknown>(STORAGE_KEY, null);
  if (!raw) return { appearance: { ...randomAppearance(), ...PRESETS[0].look, name: randomName() }, isNew: true };
  return { appearance: sanitizeAppearance(raw), isNew: false };
}

export function saveAppearance(a: Appearance): void {
  saveJSON(STORAGE_KEY, sanitizeAppearance(a));
}
