import { expect, it } from 'vitest'
import { anchorFor, clippedGeometry, fractionAt, metresPerUnit, projectPosition, unprojectPosition, emptyPlan, regions, roadsFor, validatePlan, type Restriction } from './index'
const region = regions[0]
const road = roadsFor(region).find(r => r.id.endsWith('-curve'))!
const base: Restriction = { id: 'fixture', label: 'Partial synthetic curve', referenceId: road.id, geometry: road.geometry, impact: 'full', status: 'planned', direction: 'both', startsAt: '2026-11-20T10:00', endsAt: '2026-11-20T17:00', parkingStartsAt: '', accessNotes: '', sourceUrl: '', detour: '' }
it('retains interior curve vertices and source direction at two mid-block limits in both regions', () => {
  for (const region of regions) for (const suffix of ['-curve', '-reverse']) {
    const road = roadsFor(region).find(r => r.id.endsWith(suffix))!
    const reference = anchorFor(region, road, .15, .85)
    const clipped = clippedGeometry(road, reference)
    expect(clipped.type).toBe('LineString')
    if (clipped.type !== 'LineString' || road.geometry.type !== 'LineString') throw Error('Fixture type')
    expect(clipped.coordinates.slice(1, -1)).toEqual(road.geometry.coordinates.slice(1, -1))
    expect(fractionAt(road, reference.measurementCRS, clipped.coordinates[0]).fraction).toBeCloseTo(.15, 8)
    expect(fractionAt(road, reference.measurementCRS, clipped.coordinates.at(-1)!).fraction).toBeCloseTo(.85, 8)
    expect(Math.sign(clipped.coordinates.at(-1)![0] - clipped.coordinates[0][0])).toBe(suffix === '-reverse' ? -1 : 1)
  }
})
it('checks units, an independent projection origin and inverse accuracy; exposes gesture distance in metres', () => {
  const origin = projectPosition([-79, 33.75], 'EPSG:2264')
  expect(origin[0]).toBeCloseTo(609601.22 * 3937 / 1200, 5)
  expect(origin[1]).toBeCloseTo(0, 5)
  expect(metresPerUnit('EPSG:2264')).toBeCloseTo(.3048006096, 10)
  const p = projectPosition(region.center, 'EPSG:2264')
  unprojectPosition(p, 'EPSG:2264').forEach((v, i) => expect(v).toBeCloseTo(region.center[i], 8))
  expect(fractionAt(road, 'EPSG:2264', [-78, 36]).distanceMetres).toBeGreaterThan(1000)
})
it('rejects forged geometry, source/version/CRS and cross-region identity; accepts legacy whole references', () => {
  const reference = anchorFor(region, road, .2, .8)
  const entry = { ...base, reference, geometry: clippedGeometry(road, reference) }
  const check = (item: Restriction) => validatePlan({ ...emptyPlan(), entries: [item] }, region.timeZone, region)
  expect(check(entry).entries[0].reference).toEqual(reference)
  expect(check(base).entries[0].geometry).toEqual(road.geometry)
  expect(() => check({ ...entry, geometry: road.geometry })).toThrow(/Geometry/)
  for (const patch of [{ sourceId: 'other' }, { datasetVersion: 'future' }, { featureId: 'other' }, { measurementCRS: 'EPSG:32610' as const }]) expect(() => check({ ...entry, reference: { ...reference, ...patch } })).toThrow(/source or version/)
  expect(() => check({ ...entry, referenceId: 'demo-west-curve' })).toThrow(/cross-region/)
  for (const [start, end] of [[.8, .2], [.3, .3], [-1, .8], [0, 2]]) expect(() => clippedGeometry(road, anchorFor(region, road, start, end))).toThrow()
})
it('keeps points exact and written limits null; rejects partial fractions on a point', () => {
  const point = roadsFor(region).find(r => r.geometry.type === 'Point')!
  expect(clippedGeometry(point, anchorFor(region, point))).toEqual(point.geometry)
  expect(() => clippedGeometry(point, anchorFor(region, point, .2, .8))).toThrow(/Point/)
  expect(validatePlan({ ...emptyPlan(), entries: [{ ...base, referenceId: '', geometry: null }] }, region.timeZone, region).entries[0].geometry).toBeNull()
})
