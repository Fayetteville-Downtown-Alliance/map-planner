import { describe, expect, it } from 'vitest'
import { emptyPlan, geoJSON, instantFor, onDay, publicEvents, regions, roadsFor, validatePlan, type Restriction, type EventRecord } from './index'
const entry: Restriction = { id: 'road-1', label: 'Written limits', referenceId: '', geometry: null, impact: 'full', status: 'planned', direction: 'both', startsAt: '2026-11-20T22:00', endsAt: '2026-11-21T02:00', parkingStartsAt: '2026-11-20T20:00', accessNotes: 'PRIVATE LOADING CODE', sourceUrl: '', detour: '' }
describe('plan and regional time', () => {
  it('rejects duplicate IDs and contradictory no-restrictions confirmation', () => {
    expect(() => validatePlan({ ...emptyPlan(), entries: [entry, entry] }, regions[0].timeZone)).toThrow(/unique/)
    expect(() => validatePlan({ ...emptyPlan(), entries: [entry], noRoadClosuresConfirmed: true }, regions[0].timeZone)).toThrow(/active/)
  })
  it('refuses DST gaps and folds and distinguishes regions', () => {
    expect(() => instantFor('2026-03-08T02:30', 'America/New_York')).toThrow()
    expect(() => instantFor('2026-11-01T01:30', 'America/New_York')).toThrow()
    expect(instantFor(entry.startsAt, regions[0].timeZone).toString()).not.toBe(instantFor(entry.startsAt, regions[1].timeZone).toString())
  })
  it('includes an earlier parking day and excludes the exact reopening boundary', () => {
    const item = { ...entry, startsAt: '2026-11-21T02:00', endsAt: '2026-11-22T00:00' }
    expect(onDay(item, '2026-11-20', regions[0].timeZone)).toBe(true)
    expect(onDay(item, '2026-11-22', regions[0].timeZone)).toBe(false)
    expect(onDay({ ...item, status: 'cancelled' }, '2026-11-21', regions[0].timeZone)).toBe(false)
  })
  it('rejects reversed windows and credential/javascript URLs', () => {
    expect(() => validatePlan({ ...emptyPlan(), entries: [{ ...entry, endsAt: entry.startsAt }] }, regions[0].timeZone)).toThrow()
    for (const sourceUrl of ['javascript:alert(1)', 'https://user:pass@example.com/']) expect(() => validatePlan({ ...emptyPlan(), entries: [{ ...entry, sourceUrl }] }, regions[0].timeZone)).toThrow()
  })
  it('excludes private fields and keeps Point, LineString and null geometry without expanding bounds', () => {
    const entries = [entry, ...roadsFor(regions[0]).map((road, i) => ({ ...entry, id: `road-${i + 2}`, geometry: road.geometry }))]
    const plan = { ...emptyPlan(), entries, notes: 'PRIVATE ORGANIZER NOTES' }
    const event: EventRecord = { id: 'event-1', organizationId: 'demo', title: 'Synthetic event', date: '2026-11-20', regionId: regions[0].id, revision: 4, plan: emptyPlan(), publication: { version: 3, publishedAt: '2026-11-01T00:00:00Z', plan } }
    const result = geoJSON(publicEvents([event]))
    expect(result.features.map(x => x.geometry?.type ?? null)).toEqual([null, ...roadsFor(regions[0]).map(r => r.geometry.type)])
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|accessNotes|notes/)
    expect(result.features[0].properties.publicationVersion).toBe(3)
    expect(result.features[0].id).toBe('event-1:road-1')
  })
})
