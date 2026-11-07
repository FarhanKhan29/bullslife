import { describe, expect, it } from 'vitest';
import { appearanceKey, defaultAppearance, sanitizeAppearance, sanitizeName } from '../src/character/appearance';
import { isCoopSolved } from '../src/activities/coop';
import { hits, isInFrontOf, isoToScreen, moveWithCollision, screenToIso } from '../src/game/iso';
import { ChatRateLimiter, IncomingFloodGuard, sanitizeMessage } from '../src/social/chatSafety';
import { parseMeta, parseMove } from '../src/net/multiplayer';
import { BUILDINGS, doorOutside } from '../src/game/maps/buildings';
import { buildMap, MAP_IDS } from '../src/game/maps/registry';

describe('isometric math', () => {
  it('round-trips grid ↔ screen', () => {
    const s = isoToScreen(7.25, 3.5);
    const g = screenToIso(s.x, s.y);
    expect(g.gx).toBeCloseTo(7.25);
    expect(g.gy).toBeCloseTo(3.5);
  });
  it('slides along walls instead of passing through', () => {
    const wall = [{ kind: 'rect' as const, x0: 5, y0: 0, x1: 6, y1: 10 }];
    const r = moveWithCollision(4.5, 5, 1, 0.5, 0.3, wall, { w: 20, h: 20 });
    expect(r.x).toBe(4.5); // blocked on x
    expect(r.y).toBe(5.5); // still slides on y
  });
  it('keeps players inside the map bounds', () => {
    const r = moveWithCollision(0.5, 0.5, -2, -2, 0.3, [], { w: 10, h: 10 });
    expect(r).toEqual({ x: 0.5, y: 0.5 });
  });
  it('circle collider hit test', () => {
    expect(hits({ kind: 'circle', x: 0, y: 0, r: 1 }, 1.2, 0, 0.3)).toBe(true);
    expect(hits({ kind: 'circle', x: 0, y: 0, r: 1 }, 1.4, 0, 0.3)).toBe(false);
  });
  it('depth: south/east of a building is in front', () => {
    const f = { x0: 0, y0: 0, x1: 4, y1: 4 };
    expect(isInFrontOf(5, 1, f)).toBe(true);
    expect(isInFrontOf(1, 5, f)).toBe(true);
    expect(isInFrontOf(-1, 2, f)).toBe(false);
  });
});

describe('appearance', () => {
  it('sanitizes names', () => {
    expect(sanitizeName('  Cool<script>Bull  ')).toBe('CoolscriptBull');
    expect(sanitizeName('a')).toBe('Guest');
    expect(sanitizeName('x'.repeat(40))).toHaveLength(16);
    expect(sanitizeName(42)).toBe('Guest');
  });
  it('rejects unknown options and bad colors from the network', () => {
    const a = sanitizeAppearance({ hair: 'lol', hairColor: 'red;}', top: 'hoodie', name: 'Sam' });
    const d = defaultAppearance();
    expect(a.hair).toBe(d.hair);
    expect(a.hairColor).toBe(d.hairColor);
    expect(a.top).toBe('hoodie');
    expect(a.name).toBe('Sam');
  });
  it('texture key ignores the name but changes with the outfit', () => {
    const a = defaultAppearance();
    expect(appearanceKey({ ...a, name: 'Other' })).toBe(appearanceKey(a));
    expect(appearanceKey({ ...a, hat: 'beanie' })).not.toBe(appearanceKey(a));
  });
});

describe('chat safety', () => {
  it('cleans and limits messages', () => {
    expect(sanitizeMessage('   ')).toBeNull();
    expect(sanitizeMessage(5)).toBeNull();
    expect(sanitizeMessage('hi\u0000‮there')).toBe('hi there');
    expect(sanitizeMessage('a'.repeat(500))!.length).toBe(140);
    expect(sanitizeMessage('what the fuck')).toBe('what the f***');
  });
  it('rate-limits bursts and repeats', () => {
    let now = 0;
    const rl = new ChatRateLimiter(() => now);
    expect(rl.check('hello').ok).toBe(true);
    rl.record('hello');
    now += 100;
    expect(rl.check('again').ok).toBe(false); // too fast
    now += 1000;
    expect(rl.check('hello').ok).toBe(false); // duplicate
    for (let i = 0; i < 4; i++) {
      now += 1000;
      expect(rl.check('msg' + i).ok).toBe(true);
      rl.record('msg' + i);
    }
    now += 1000;
    expect(rl.check('one more').ok).toBe(false); // burst limit (5 in 10s)
  });
  it('guards against incoming floods', () => {
    let now = 0;
    const g = new IncomingFloodGuard(3, 1000, () => now);
    expect([g.allow('a'), g.allow('a'), g.allow('a'), g.allow('a')]).toEqual([true, true, true, false]);
    expect(g.allow('b')).toBe(true);
    now += 1500;
    expect(g.allow('a')).toBe(true);
  });
});

describe('network validation', () => {
  it('accepts good move packets and rejects bad ones', () => {
    expect(parseMove({ id: 'abc', seq: 1, x: 3, y: 4, f: 'front', fl: false, m: true, map: 'campus' })).not.toBeNull();
    expect(parseMove({ id: 'abc', seq: 1, x: NaN, y: 4, f: 'front', map: 'campus' })).toBeNull();
    expect(parseMove({ id: 'abc', seq: 1, x: 3, y: 4, f: 'upside', map: 'campus' })).toBeNull();
    expect(parseMove({ id: 'abc', seq: 1, x: 3, y: 4, f: 'front', map: 'mars' })).toBeNull();
    expect(parseMove({ id: 'abc', seq: 1, x: 3, y: 4, f: 'front', map: 'davis', p: 1, it: 0 })?.p).toBe(1);
    expect(parseMove({ id: 'abc', seq: 1, x: 3, y: 4, f: 'front', map: 'davis', p: 9, it: 999 })).toMatchObject({ p: 0, it: -1 });
  });
  it('sanitizes presence metadata', () => {
    expect(parseMeta({ id: 'BAD ID!' })).toBeNull();
    const m = parseMeta({ id: 'abcdef123', look: { name: '<b>x</b>yz' }, map: 'union', plate: 'Z' });
    expect(m?.map).toBe('union');
    expect(m?.plate).toBeNull();
    expect(m?.look.name).toBe('bxbyz');
  });
});

describe('co-op switches', () => {
  it('needs two DIFFERENT players on A and B', () => {
    expect(isCoopSolved([{ id: 'p1', map: 'campus', plate: 'A' }])).toBe(false);
    expect(isCoopSolved([{ id: 'p1', map: 'campus', plate: 'A' }, { id: 'p1', map: 'campus', plate: 'B' }])).toBe(false);
    expect(isCoopSolved([{ id: 'p1', map: 'campus', plate: 'A' }, { id: 'p2', map: 'union', plate: 'B' }])).toBe(false);
    expect(isCoopSolved([{ id: 'p1', map: 'campus', plate: 'A' }, { id: 'p2', map: 'campus', plate: 'B' }])).toBe(true);
  });
});

describe('maps', () => {
  const maps = MAP_IDS.map((id) => buildMap(id));
  const free = (map: ReturnType<typeof buildMap>, x: number, y: number) => !map.colliders.some((c) => hits(c, x, y, 0.28));

  it('has the campus plus one interior for each of the 19 buildings', () => {
    expect(BUILDINGS).toHaveLength(19);
    expect(MAP_IDS).toHaveLength(20);
    expect(new Set(MAP_IDS).size).toBe(20);
  });

  for (const map of maps) {
    it(`${map.id}: spawn and teleport destinations are walkable`, () => {
      expect(free(map, map.spawn.x, map.spawn.y)).toBe(true);
      for (const t of map.triggers) if (t.action.type === 'teleport') expect(free(map, t.action.x, t.action.y)).toBe(true);
    });
    it(`${map.id}: props sit inside the map`, () => {
      for (const p of map.props) {
        expect(p.gx).toBeGreaterThanOrEqual(-0.5);
        expect(p.gy).toBeGreaterThanOrEqual(-0.5);
        expect(p.gx).toBeLessThanOrEqual(map.w + 0.5);
        expect(p.gy).toBeLessThanOrEqual(map.h + 0.5);
      }
    });
  }

  it('every interior has an exit back to campus and a passport stamp', () => {
    for (const map of maps.filter((m) => m.id !== 'campus')) {
      expect(map.triggers.some((t) => t.action.type === 'goto' && t.action.to === 'campus')).toBe(true);
      expect(map.interactables.some((i) => i.action.type === 'stamp' && i.action.stamp === map.id)).toBe(true);
    }
  });

  it('every building door is reachable from outside', () => {
    const campus = maps[0];
    for (const b of BUILDINGS) {
      const o = doorOutside(b);
      expect(free(campus, o.x, o.y), b.id).toBe(true);
      expect(campus.triggers.some((t) => t.action.type === 'goto' && t.action.to === b.id)).toBe(true);
    }
  });

  it('interactive props have sensible actions', () => {
    for (const map of maps)
      for (const p of map.props) {
        if (!p.act) continue;
        expect(['sit', 'lie', 'eat', 'use']).toContain(p.act.kind);
        const act = p.act;
        if (act.kind === 'use' && act.use === 'whiteboard') expect(map.boards?.some((b) => b.id === act.board)).toBe(true);
      }
  });
});
