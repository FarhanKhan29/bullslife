/** Central lookup for every map: the campus plus one interior per building. */
import { BUILDINGS } from './buildings';
import { buildCampus } from './campus';
import { arenaInterior, cfaInterior, commonsInterior, crossroadsInterior, ellicottInterior, governorsInterior, greinerInterior, stadiumInterior } from './interiorsLife';
import { bellInterior, davisInterior, furnasInterior, ketterInterior } from './interiorsEng';
import { baldyInterior, capenInterior, clemensInterior, lockwoodInterior, nortonInterior, talbertInterior, unionInterior } from './interiorsSpine';
import type { MapDef, MapId } from './types';

const INTERIORS: Record<string, () => MapDef> = {
  union: unionInterior,
  capen: capenInterior,
  lockwood: lockwoodInterior,
  norton: nortonInterior,
  talbert: talbertInterior,
  baldy: baldyInterior,
  clemens: clemensInterior,
  davis: davisInterior,
  bell: bellInterior,
  furnas: furnasInterior,
  ketter: ketterInterior,
  ellicott: ellicottInterior,
  governors: governorsInterior,
  greiner: greinerInterior,
  arena: arenaInterior,
  stadium: stadiumInterior,
  cfa: cfaInterior,
  commons: commonsInterior,
  crossroads: crossroadsInterior,
};

export const MAP_IDS: string[] = ['campus', ...BUILDINGS.map((b) => b.id)];
const MAP_SET = new Set(MAP_IDS);
export const isMapId = (v: unknown): v is MapId => typeof v === 'string' && MAP_SET.has(v);

/** Builds a map definition (uncached). Prop colliders are merged into map.colliders. */
export function buildMap(id: MapId): MapDef {
  const map = id === 'campus' ? buildCampus() : (INTERIORS[id] ?? INTERIORS.union)();
  const known = new Set(map.colliders);
  for (const p of map.props) if (p.collider && !known.has(p.collider)) map.colliders.push(p.collider);
  return map;
}
