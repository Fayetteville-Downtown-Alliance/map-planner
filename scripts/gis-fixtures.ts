import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { anchorFor, clippedGeometry, emptyPlan, projectPosition, regions, roadsFor, type Restriction } from '@map-planner/domain'
import { createApp } from '../apps/api/src/app'
import { PlannerStore } from '../apps/api/src/store'

const directory = process.argv[2] ?? 'test-results/gis'
await mkdir(directory, { recursive: true })
const store = new PlannerStore(':memory:')
try {
  const region = regions[0], roads = roadsFor(region)
  const event = store.create('sandbox', randomUUID(), { title: 'Synthetic engineering interoperability fixture', date: '2026-11-20', regionId: region.id })
  const base: Restriction = { id: 'base', label: 'Synthetic fixture', referenceId: '', geometry: null, impact: 'full', status: 'planned', direction: 'both', startsAt: '2026-11-20T10:00', endsAt: '2026-11-20T17:00', parkingStartsAt: '', sourceUrl: '', detour: '', accessNotes: 'PRIVATE SENTINEL' }
  const lines = roads.filter(r => /-(curve|reverse)$/.test(r.id))
  const entries = [
    ...lines.map(road => { const reference = anchorFor(region, road, .2, .8); return { ...base, id: road.id, label: road.label, referenceId: road.id, reference, geometry: clippedGeometry(road, reference) } }),
    { ...base, id: 'point', label: 'Synthetic point', referenceId: roads.at(-1)!.id, reference: anchorFor(region, roads.at(-1)!), geometry: roads.at(-1)!.geometry },
    { ...base, id: 'unmapped', label: 'Written limits remain unmapped' },
    { ...base, id: 'unverified', label: 'Unverified independent location', geometry: { type: 'Point' as const, coordinates: [-78.879,35.052] as [number,number] } },
  ]
  store.update('sandbox', event.id, randomUUID(), 0, 'save', { ...emptyPlan(), notes: 'PRIVATE SENTINEL', entries })
  store.update('sandbox', event.id, randomUUID(), 1, 'publish')
  // Exercise the actual API projection, not a separate export implementation.
  const response = await createApp(store, { sandbox: true }).request('http://127.0.0.1:8788/api/v1/public/sandbox/closures?format=geojson')
  if (response.status !== 200) throw Error('Public API fixture export failed')
  const payload = await response.json()
  if (JSON.stringify(payload).includes('PRIVATE')) throw Error('Private data leaked into export')
  await writeFile(`${directory}/closures.geojson`, JSON.stringify(payload, null, 2)+'\n')
  for (const [name, type] of [['lines','LineString'], ['points','Point'], ['unmapped',null]] as const) {
    await writeFile(`${directory}/closures-${name}.geojson`, JSON.stringify({ ...payload, features: payload.features.filter((f: {geometry: {type: string} | null}) => (f.geometry?.type ?? null) === type) }, null, 2)+'\n')
  }
  await writeFile(`${directory}/manifest.json`, JSON.stringify({
    schemaVersion: 1, synthetic: true, publicationVersion: 2,
    lines: lines.map(road => { const reference = anchorFor(region, road, .2, .8); return { id: road.id, raw: road.geometry, reference, expected: clippedGeometry(road, reference) } }),
    controlPoints: [[-79,33.75], region.center].map(p => ({ wgs84: p, epsg2264: projectPosition(p, 'EPSG:2264') })),
  }, null, 2)+'\n')
  console.log('Generated API-backed synthetic GIS fixtures: 2 partial curves, 2 points, 1 unmapped; private sentinel excluded.')
} finally { store.close() }
