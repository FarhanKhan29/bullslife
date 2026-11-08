/** Central lookup for every map: the campus, building interiors and linked floors. */
import { buildCampus } from './campus';
import { arenaInterior, cfaGalleryInterior, cfaInterior, cfaMainstageInterior, commonsInterior, crossroadsInterior, ellicottInterior, governorsInterior, greinerInterior, greinerSuiteInterior, stadiumInterior } from './interiorsLife';
import { bellInterior, davisInterior, furnasInterior, ketterInterior } from './interiorsEng';
import { baldyInterior, capenInterior, clemensInterior, cookeInterior, hochstetterInterior, knoxInterior, lockwoodInterior, nortonInterior, silvermanInterior, talbertInterior, unionInterior } from './interiorsSpine';
import { bookstoreInterior, ellicottFoodCourtInterior, governorsDiningInterior, oneWorldInterior, unionDiningInterior } from './interiorsRetail';
import type { MapDef, MapId } from './types';

const INTERIORS: Record<string, () => MapDef> = {
  union: unionInterior,
  capen: capenInterior,
  lockwood: lockwoodInterior,
  norton: nortonInterior,
  talbert: talbertInterior,
  baldy: baldyInterior,
  clemens: clemensInterior,
  knox: knoxInterior,
  cooke: cookeInterior,
  hochstetter: hochstetterInterior,
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
  bookstore: bookstoreInterior,
  'union-dining': unionDiningInterior,
  'one-world': oneWorldInterior,
  silverman: silvermanInterior,
  'ellicott-food': ellicottFoodCourtInterior,
  'governors-dining': governorsDiningInterior,
  'greiner-suite': greinerSuiteInterior,
  'cfa-mainstage': cfaMainstageInterior,
  'cfa-gallery': cfaGalleryInterior,
};

export const MAP_IDS: string[] = ['campus', ...Object.keys(INTERIORS)];
const MAP_SET = new Set(MAP_IDS);
export const isMapId = (v: unknown): v is MapId => typeof v === 'string' && MAP_SET.has(v);

/** Builds a map definition (uncached). Prop colliders are merged into map.colliders. */
export function buildMap(id: MapId): MapDef {
  const map = id === 'campus' ? buildCampus() : (INTERIORS[id] ?? INTERIORS.union)();
  const known = new Set(map.colliders);
  for (const p of map.props) if (p.collider && !known.has(p.collider)) map.colliders.push(p.collider);
  return map;
}
