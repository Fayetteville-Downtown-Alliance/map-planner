import { anchorFor, clippedGeometry, type ReferenceAnchor } from './linear-reference'
export * from './linear-reference'
import { Temporal } from '@js-temporal/polyfill'
import { z } from 'zod'

export const localMinute = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  try { return Temporal.PlainDate.from(value).toString() === value } catch { return false }
}, 'Use a real calendar date.')
const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
const sourceUrl = z.union([z.literal(''), z.url().refine(value => {
  const u = new URL(value)
  return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password
}, 'Use a public HTTP or HTTPS URL without credentials.')])
const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
export const geometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Point'), coordinates: position }).strict(),
  z.object({ type: z.literal('LineString'), coordinates: z.array(position).min(2).max(2000) }).strict(),
]).nullable()
export type Geometry = z.infer<typeof geometrySchema>

export class ReferenceError extends Error {}
export const referenceAnchorSchema = z.object({
  sourceId: identifier, datasetVersion: identifier, featureId: identifier,
  measurementCRS: z.enum(['EPSG:2264', 'EPSG:32610']),
  startFraction: z.number().min(0).max(1), endFraction: z.number().min(0).max(1),
}).strict()
export const restrictionSchema = z.object({
  id: identifier, label: z.string().trim().min(2).max(160),
  referenceId: z.string().max(160), geometry: geometrySchema, reference: referenceAnchorSchema.optional(),
  impact: z.enum(['full', 'lane', 'parking']), status: z.enum(['planned', 'confirmed', 'cancelled']),
  direction: z.enum(['both', 'from_to', 'to_from']),
  startsAt: localMinute, endsAt: localMinute,
  parkingStartsAt: z.union([localMinute, z.literal('')]),
  accessNotes: z.string().max(800), sourceUrl,
  detour: z.string().max(400),
}).strict()
export type Restriction = z.infer<typeof restrictionSchema>
export const planSchema = z.object({
  version: z.literal(1), entries: z.array(restrictionSchema).max(32), notes: z.string().max(2000),
  noRoadClosuresConfirmed: z.boolean(),
}).strict()
export type Plan = z.infer<typeof planSchema>
export const emptyPlan = (): Plan => ({ version: 1, entries: [], notes: '', noRoadClosuresConfirmed: false })
export const eventInputSchema = z.object({ title: z.string().trim().min(2).max(160), date: day, regionId: identifier }).strict()
export type EventInput = z.infer<typeof eventInputSchema>
export type Region = { id: string; name: string; timeZone: string; center: [number, number]; referenceVersion: string }
export const regions: Region[] = [
  { id: 'demo-east', name: 'Eastern demonstration region', timeZone: 'America/New_York', center: [-78.88, 35.052], referenceVersion: 'synthetic-v1' },
  { id: 'demo-west', name: 'Pacific demonstration region', timeZone: 'America/Los_Angeles', center: [-122.33, 47.605], referenceVersion: 'synthetic-v1' },
]
export type Road = { id: string; label: string; geometry: NonNullable<Geometry> }
/** Original, deliberately fictitious reference geometry; no City or OSM data. */
export function roadsFor(region: Region): Road[] {
  const [x, y] = region.center
  return [
    { id: `${region.id}-example`, label: 'Example Street · West Avenue to East Avenue', geometry: { type: 'LineString', coordinates: [[x - .004, y], [x, y], [x + .004, y]] } },
    { id: `${region.id}-market`, label: 'Demonstration Avenue · North Road to South Road', geometry: { type: 'LineString', coordinates: [[x, y - .003], [x, y], [x, y + .003]] } },
    { id: `${region.id}-curve`, label: 'Curved Fixture Road · source west to east', geometry: { type: 'LineString', coordinates: [[x-.004,y+.001], [x-.002,y+.0025], [x+.001,y+.0015], [x+.004,y+.003]] } },
    { id: `${region.id}-reverse`, label: 'Reversed Fixture Road · source east to west', geometry: { type: 'LineString', coordinates: [[x+.004,y-.001], [x+.001,y-.0025], [x-.002,y-.0015], [x-.004,y-.003]] } },
    { id: `${region.id}-point`, label: 'Example Street at Demonstration Avenue', geometry: { type: 'Point', coordinates: [x, y] } },
  ]
}
export function instantFor(value: string, timeZone: string): Temporal.Instant {
  // Reject DST gaps and folds instead of inventing an offset for ambiguous wall time.
  return Temporal.PlainDateTime.from(value).toZonedDateTime(timeZone, { disambiguation: 'reject' }).toInstant()
}
export function validatePlan(input: unknown, timeZone: string, region?: Region): Plan {
  const plan = planSchema.parse(input)
  const ids = new Set<string>()
  for (const item of plan.entries) {
    if (ids.has(item.id)) throw new Error('Each restriction needs a unique ID.')
    ids.add(item.id)
    if (region) validateReference(item, region)
    const start = instantFor(item.startsAt, timeZone)
    const end = instantFor(item.endsAt, timeZone)
    if (Temporal.Instant.compare(end, start) <= 0) throw new Error(`${item.label}: reopening must be after the start.`)
    if (item.parkingStartsAt && Temporal.Instant.compare(instantFor(item.parkingStartsAt, timeZone), start) > 0) {
      throw new Error(`${item.label}: parking restrictions must start at or before traffic restrictions.`)
    }
  }
  if (plan.noRoadClosuresConfirmed && plan.entries.some(item => item.status !== 'cancelled')) {
    throw new Error('Confirmed no restrictions cannot be combined with active restrictions.')
  }
  return plan
}
/** New references are canonical; old whole-reference records must match the pinned fixture. */
export function validateReference(item: Restriction, region: Region) {
  if (!item.referenceId && !item.reference) return // Unverified independent geometry or written limits.
  const road = roadsFor(region).find(r => r.id === item.referenceId)
  if (!road) throw new ReferenceError('Unknown or cross-region reference. Keep written limits until reviewed.')
  const expectedAnchor = anchorFor(region, road)
  if (item.reference && (['sourceId', 'datasetVersion', 'featureId', 'measurementCRS'] as const).some(key => item.reference![key] !== expectedAnchor[key])) {
    throw new ReferenceError('Reference source or version changed. Review the pinned reference before saving.')
  }
  let expected: NonNullable<Geometry>
  try { expected = clippedGeometry(road, item.reference ?? expectedAnchor) }
  catch (error) { throw new ReferenceError(error instanceof Error ? error.message : 'Invalid reference limits.') }
  const points = (g: Geometry) => !g ? [] : g.type === 'Point' ? [g.coordinates] : g.coordinates
  const actualPoints = points(item.geometry), expectedPoints = points(expected)
  if (item.geometry?.type !== expected.type || actualPoints.length !== expectedPoints.length || actualPoints.some((p, i) => p.some((v, j) => Math.abs(v - expectedPoints[i][j]) > 1e-8))) {
    throw new ReferenceError('Geometry does not match the source-bound limits. Reapply the reviewed reference limits.')
  }
  item.geometry = expected
}
export type EventRecord = EventInput & { id: string; organizationId: string; revision: number; plan: Plan; publication: Publication | null }
export type Publication = { version: number; publishedAt: string; plan: Plan }
export type PublicRestriction = Omit<Restriction, 'accessNotes'> & { startsAtUtc: string; endsAtUtc: string; parkingStartsAtUtc: string | null }
export function publicRestriction(item: Restriction, timeZone: string): PublicRestriction {
  // Explicit public field selection. New private fields do not leak by default.
  return { id: item.id, label: item.label, referenceId: item.referenceId, geometry: item.geometry, ...(item.reference ? { reference: item.reference } : {}),
    impact: item.impact, status: item.status, direction: item.direction, startsAt: item.startsAt, endsAt: item.endsAt,
    parkingStartsAt: item.parkingStartsAt, sourceUrl: item.sourceUrl, detour: item.detour,
    startsAtUtc: instantFor(item.startsAt, timeZone).toString(), endsAtUtc: instantFor(item.endsAt, timeZone).toString(),
    parkingStartsAtUtc: item.parkingStartsAt ? instantFor(item.parkingStartsAt, timeZone).toString() : null }
}
export function onDay(item: Restriction, date: string, timeZone: string): boolean {
  const dateValue = Temporal.PlainDate.from(day.parse(date))
  const start = dateValue.toZonedDateTime({ timeZone, plainTime: '00:00' }).toInstant()
  const end = dateValue.add({ days: 1 }).toZonedDateTime({ timeZone, plainTime: '00:00' }).toInstant()
  const earliest = instantFor(item.parkingStartsAt || item.startsAt, timeZone)
  return item.status !== 'cancelled' && Temporal.Instant.compare(earliest, end) < 0 && Temporal.Instant.compare(instantFor(item.endsAt, timeZone), start) > 0
}
export type PublicEvent = { id: string; title: string; date: string; regionId: string; timeZone: string; publicationVersion: number; publishedAt: string; entries: PublicRestriction[] }
export function publicEvents(events: EventRecord[], date?: string): PublicEvent[] {
  return events.flatMap(event => {
    const region = regions.find(r => r.id === event.regionId)
    if (!region || !event.publication) return []
    const entries = event.publication.plan.entries.filter(item => item.status !== 'cancelled' && (!date || onDay(item, date, region.timeZone)))
    return entries.length ? [{ id: event.id, title: event.title, date: event.date, regionId: event.regionId, timeZone: region.timeZone,
      publicationVersion: event.publication.version, publishedAt: event.publication.publishedAt,
      entries: entries.map(item => publicRestriction(item, region.timeZone)) }] : []
  })
}
export function geoJSON(events: PublicEvent[]) {
  return { type: 'FeatureCollection' as const, features: events.flatMap(event => event.entries.map(({ geometry, ...entry }) => ({
    type: 'Feature' as const, id: `${event.id}:${entry.id}`, geometry,
    properties: { ...entry, reference: undefined,
      restrictionId: entry.id, geometryStatus: entry.reference ? 'source-bound-synthetic' : entry.referenceId ? 'legacy-whole-synthetic' : geometry ? 'unverified' : 'unmapped',
      sourceId: entry.reference?.sourceId ?? null, datasetVersion: entry.reference?.datasetVersion ?? null,
      featureId: entry.reference?.featureId ?? null, measurementCRS: entry.reference?.measurementCRS ?? null,
      startFraction: entry.reference?.startFraction ?? null, endFraction: entry.reference?.endFraction ?? null,
      eventId: event.id, eventTitle: event.title, timeZone: event.timeZone, publicationVersion: event.publicationVersion },
  }))) }
}
