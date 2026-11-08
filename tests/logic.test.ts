import { describe, expect, it } from 'vitest';
import { appearanceKey, defaultAppearance, sanitizeAppearance, sanitizeName } from '../src/character/appearance';
import { isCoopSolved } from '../src/activities/coop';
import { hits, isInFrontOf, isoToScreen, moveWithCollision, screenToIso } from '../src/game/iso';
import { ChatRateLimiter, IncomingFloodGuard, sanitizeMessage } from '../src/social/chatSafety';
import { parseMeta, parseMove } from '../src/net/multiplayer';
import { BUILDINGS, BUILDING_BY_ID, doorOutside, doorTrigger } from '../src/game/maps/buildings';
import { BUS_ROUTES, COOP, LAKE, PARKING_LOTS, ROADS } from '../src/game/maps/campus';
import { npcsFor } from '../src/game/npcs';
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

  it('has a registered interior for every enterable building', () => {
    for (const b of BUILDINGS) expect(MAP_IDS).toContain(b.id);
    expect(new Set(MAP_IDS).size).toBe(MAP_IDS.length);
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
    for (const b of BUILDINGS) {
      const map = maps.find((m) => m.id === b.id)!;
      expect(map.triggers.some((t) => t.action.type === 'goto' && t.action.to === 'campus')).toBe(true);
      if (b.passport !== false) {
        expect(map.interactables.some((i) => i.action.type === 'stamp' && i.action.stamp === map.id)).toBe(true);
      }
    }
  });

  it('every building door is reachable from outside', () => {
    const campus = maps[0];
    for (const b of BUILDINGS) {
      const o = doorOutside(b);
      expect(free(campus, o.x, o.y), b.id).toBe(true);
      const trigger = doorTrigger(b);
      const x = b.door.side === 'e' ? trigger.x1 - 0.05 : o.x;
      const y = b.door.side === 's' ? trigger.y1 - 0.05 : o.y;
      expect(free(campus, x, y), b.id + ' door trigger').toBe(true);
      expect(campus.triggers.some((t) => t.action.type === 'goto' && t.action.to === b.id)).toBe(true);
    }
  });

  it('follows the north-up campus plan and keeps the lake and co-op area playable', () => {
    const b = (id: string) => BUILDING_BY_ID.get(id)!;
    expect(b('ellicott').y0).toBeLessThan(b('greiner').y0);
    expect(b('greiner').y0).toBeLessThan(b('davis').y0);
    expect(b('governors').x0).toBeLessThan(b('capen').x0);
    expect(b('capen').x0).toBeLessThan(b('union').x0);
    expect(b('union').x0).toBeLessThan(b('cfa').x0);
    expect(b('cfa').x0).toBeLessThan(b('arena').x0);
    expect(b('arena').x0).toBeLessThan(b('stadium').x0);
    expect(LAKE.x).toBeGreaterThan(b('commons').x0);
    expect(LAKE.y).toBeLessThan(b('arena').y0);
    expect(free(maps[0], LAKE.x, LAKE.y)).toBe(false);
    for (const spot of [COOP.plateA, COOP.plateB, COOP.portal]) {
      expect(free(maps[0], spot.x, spot.y)).toBe(true);
    }
  });

  it('connects floors without spawning inside furniture or an exit', () => {
    for (const map of maps) {
      const links = [...map.triggers, ...map.interactables];
      for (const { action } of links) {
        if (action.type !== 'enter' && action.type !== 'goto') continue;
        const destination = maps.find((m) => m.id === action.to)!;
        expect(destination?.id, map.id + ' to ' + action.to).toBe(action.to);
        const { x, y } = action.spawn ?? destination.spawn;
        expect(free(destination, x, y), map.id + ' to ' + action.to).toBe(true);
        expect(destination.triggers.some((t) => x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1)).toBe(false);
      }
    }
  });

  it('leaves a walkable route from each entrance to its cashiers and interior passages', () => {
    for (const map of maps.filter((m) => m.id !== 'campus')) {
      const stops = [
        ...map.props.flatMap((p) => p.act?.kind === 'checkout'
          ? [{ x: p.gx, y: p.gy, reach: p.reach ?? 1.3, name: p.act.label }] : []),
        ...map.interactables.flatMap((p) => p.action.type === 'enter'
          ? [{ x: p.gx, y: p.gy, reach: p.radius, name: p.prompt }] : []),
      ];
      if (!stops.length) continue;
      const todo = [{ x: 0, y: 0 }];
      const seen = new Set(['0,0']);
      const step = 0.25;
      for (let i = 0; i < todo.length && stops.length; i++) {
        const here = todo[i];
        const x = map.spawn.x + here.x * step;
        const y = map.spawn.y + here.y * step;
        for (let j = stops.length - 1; j >= 0; j--) {
          if (Math.hypot(x - stops[j].x, y - stops[j].y) < stops[j].reach) stops.splice(j, 1);
        }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const next = { x: here.x + dx, y: here.y + dy };
          const key = next.x + ',' + next.y;
          if (seen.has(key)) continue;
          seen.add(key);
          const moved = moveWithCollision(x, y, dx * step, dy * step, 0.28, map.colliders, map);
          if (moved.x !== x || moved.y !== y) todo.push(next);
        }
      }
      expect(stops.map((s) => s.name), map.id).toEqual([]);
    }
  });

  it('interactive props have sensible actions', () => {
    for (const map of maps)
      for (const p of map.props) {
        if (!p.act) continue;
        expect(['sit', 'lie', 'take', 'checkout', 'use']).toContain(p.act.kind);
        const act = p.act;
        if (act.kind === 'use' && act.use === 'whiteboard') expect(map.boards?.some((b) => b.id === act.board)).toBe(true);
      }
  });
});

describe('roads, buses and NPCs', () => {
  const campus = buildMap('campus');
  const drivable = ['road', 'crosswalk', 'asphalt'];
  const free = (m: ReturnType<typeof buildMap>, x: number, y: number, r = 0.2) => !m.colliders.some((c) => hits(c, x, y, r));

  it('every parking lot is connected to the road network', () => {
    const seen = new Set<string>(['4,4']);
    const queue = [[4, 4]];
    while (queue.length) {
      const [x, y] = queue.pop()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        if (!seen.has(key) && drivable.includes(campus.ground[y + dy]?.[x + dx] ?? '')) {
          seen.add(key);
          queue.push([x + dx, y + dy]);
        }
      }
    }
    for (const l of PARKING_LOTS) expect(seen.has(`${l.x0 + 1},${l.y0 + 1}`), l.name).toBe(true);
  });

  it('roads do not run through buildings', () => {
    for (const r of ROADS) {
      for (let y = r.y0; y < r.y1; y++) {
        for (let x = r.x0; x < r.x1; x++) {
          for (const b of BUILDINGS) {
            expect(x + 1 <= b.x0 || x >= b.x0 + b.w || y + 1 <= b.y0 || y >= b.y0 + b.d, `${b.id} at ${x},${y}`).toBe(true);
          }
        }
      }
    }
  });

  it('buses stay on roads', () => {
    for (const route of BUS_ROUTES) {
      route.forEach((a, i) => {
        const b = route[(i + 1) % route.length];
        for (let t = 0; t <= 1; t += 0.02) {
          const g = campus.ground[Math.floor(a.y + (b.y - a.y) * t)][Math.floor(a.x + (b.x - a.x) * t)];
          expect(drivable).toContain(g);
        }
      });
    }
  });

  it('NPCs stand and walk only in open space, on every map', () => {
    for (const id of MAP_IDS) {
      const map = buildMap(id);
      for (const g of npcsFor(map)) {
        for (const n of g.members) {
          expect(free(map, n.x, n.y), `${id} ${n.name} at ${n.x},${n.y}`).toBe(true);
          const r = n.route ?? [];
          for (let i = 0; i + 1 < r.length; i++) {
            for (let t = 0; t <= 1; t += 0.02) {
              const x = r[i].x + (r[i + 1].x - r[i].x) * t;
              const y = r[i].y + (r[i + 1].y - r[i].y) * t;
              expect(free(map, x, y), `${n.name} route at ${x.toFixed(1)},${y.toFixed(1)}`).toBe(true);
            }
          }
        }
      }
    }
  });
});
