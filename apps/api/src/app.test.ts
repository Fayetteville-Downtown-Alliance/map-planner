import { afterEach, beforeEach, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { createApp } from './app'
import { PlannerStore } from './store'
import { emptyPlan, type Plan } from '@map-planner/domain'
let store: PlannerStore
let app: ReturnType<typeof createApp>
beforeEach(() => { store = new PlannerStore(':memory:'); app = createApp(store, { sandbox: true }) })
afterEach(() => store.close())
function request(path: string, method = 'GET', body?: unknown, id = randomUUID()) {
  return app.request(`http://127.0.0.1:8788/api/v1/${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-Map-Planner-Sandbox': '1', 'Idempotency-Key': id }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
}
const input = { title: 'Synthetic test event', date: '2026-11-20', regionId: 'demo-east' }
const plan: Plan = { ...emptyPlan(), notes: 'PRIVATE NOTES', entries: [{ id: 'sample', label: 'Synthetic street', referenceId: '', geometry: { type: 'Point', coordinates: [-78.88, 35.052] }, impact: 'full', status: 'planned', direction: 'both', startsAt: '2026-11-20T10:00', endsAt: '2026-11-20T15:00', parkingStartsAt: '', sourceUrl: '', detour: '', accessNotes: 'PRIVATE ACCESS' }] }
it('persists save/publish/edit/withdraw with immutable public snapshots and no delivery transport', async () => {
  const created = await (await request('organizations/sandbox/events', 'POST', input)).json()
  const path = `organizations/sandbox/events/${created.id}`
  expect((await request(`${path}/plan`, 'PATCH', { expectedRevision: 0, plan })).status).toBe(200)
  expect((await request('public/sandbox/closures')).status).toBe(200)
  expect((await (await request('public/sandbox/closures')).json()).events).toEqual([])
  expect((await request(`${path}/publish`, 'POST', { expectedRevision: 1 })).status).toBe(200)
  const first = await request('public/sandbox/closures?format=geojson')
  const etag = first.headers.get('etag')!
  expect(first.headers.get('content-type')).toContain('application/geo+json')
  expect(await first.text()).not.toMatch(/PRIVATE|accessNotes|notes/)
  expect((await request(`${path}/plan`, 'PATCH', { expectedRevision: 2, plan: emptyPlan() })).status).toBe(200)
  const unchanged = await request('public/sandbox/closures?format=geojson')
  expect(unchanged.headers.get('etag')).toBe(etag)
  expect((await app.request('http://127.0.0.1:8788/api/v1/public/sandbox/closures?format=geojson', { headers: { 'If-None-Match': etag } })).status).toBe(304)
  expect((await request(`${path}/withdraw`, 'POST', { expectedRevision: 3 })).status).toBe(200)
  expect((await (await request('public/sandbox/closures')).json()).events).toEqual([])
})
it('reconciles retries by receipt and rejects changed content with reused operation IDs', async () => {
  const key = randomUUID()
  const first = await (await request('organizations/sandbox/events', 'POST', input, key)).json()
  const again = await (await request('organizations/sandbox/events', 'POST', input, key)).json()
  expect(again.id).toBe(first.id)
  expect((await (await request(`organizations/sandbox/operations/${key}`)).json()).id).toBe(first.id)
  expect((await request('organizations/sandbox/events', 'POST', { ...input, title: 'Different' }, key)).status).toBe(409)
  expect(store.list('sandbox')).toHaveLength(1)
})
it('atomically refuses stale plans and scopes all child lookups', async () => {
  const created = await (await request('organizations/sandbox/events', 'POST', input)).json()
  store.create('other-tenant', randomUUID(), input)
  expect((await request(`organizations/sandbox/events/${created.id}/plan`, 'PATCH', { expectedRevision: 0, plan })).status).toBe(200)
  const stale = await request(`organizations/sandbox/events/${created.id}/plan`, 'PATCH', { expectedRevision: 0, plan: emptyPlan() })
  expect(stale.status).toBe(409)
  expect(store.get('sandbox', created.id).plan.entries).toHaveLength(1)
  expect((await request(`organizations/other-tenant/events/${created.id}`)).status).toBe(404)
  expect(() => store.get('other-tenant', created.id)).toThrow()
})
it('enforces origin/host/header/body/query limits and fails closed outside the sandbox', async () => {
  expect(() => createApp(store, { sandbox: false })).toThrow(/Production/)
  expect((await app.request('http://evil.example/api/health')).status).toBe(403)
  expect((await app.request('http://127.0.0.1:8788/api/health', { headers: { Origin: 'https://evil.example' } })).status).toBe(403)
  expect((await app.request('http://127.0.0.1:8788/api/v1/organizations/sandbox/events', { method: 'POST', body: '{}' })).status).toBe(403)
  expect((await request('public/sandbox/closures?date=2026-02-30')).status).toBe(400)
  expect((await request('public/sandbox/closures?token=secret')).status).toBe(400)
  expect((await request('organizations/sandbox/events', 'POST', { ...input, notes: 'x'.repeat(140_000) })).status).toBe(413)
})
it('rejects invalid time windows without updating a saved revision', async () => {
  const created = store.create('sandbox', randomUUID(), input)
  const invalid = { ...plan, entries: [{ ...plan.entries[0], endsAt: plan.entries[0].startsAt }] }
  expect((await request(`organizations/sandbox/events/${created.id}/plan`, 'PATCH', { expectedRevision: 0, plan: invalid })).status).toBe(400)
  expect(store.get('sandbox', created.id).revision).toBe(0)
})
it('bounds repeated source inspections without accepting arbitrary URLs or making writes', async () => {
  let fetches = 0
  const metadataApp = createApp(store, { sandbox: true, fetcher: async () => {
    fetches++
    return Response.json({ name: 'Synthetic schema', geometryType: 'esriGeometryPoint', fields: [] })
  } })
  for (let i = 0; i < 20; i++) expect((await metadataApp.request('http://127.0.0.1:8788/api/v1/reference-sources/fayetteville-streets/metadata')).status).toBe(200)
  const limited = await metadataApp.request('http://127.0.0.1:8788/api/v1/reference-sources/fayetteville-streets/metadata')
  expect(limited.status).toBe(429)
  expect(limited.headers.get('Retry-After')).toBe('60')
  expect(fetches).toBe(20)
  expect(store.list('sandbox')).toEqual([])
})
it('rejects forged source geometry without an audit/version write and publishes flat source provenance', async () => {
  const { anchorFor, clippedGeometry, regions, roadsFor } = await import('@map-planner/domain')
  const road = roadsFor(regions[0]).find(r => r.id.endsWith('-curve'))!
  const reference = anchorFor(regions[0], road, .2, .8)
  const created = store.create('sandbox', randomUUID(), input)
  const path = `organizations/sandbox/events/${created.id}`
  const partial = { ...plan, entries: [{ ...plan.entries[0], referenceId: road.id, reference, geometry: clippedGeometry(road, reference) }] }
  const forged = { ...partial, entries: [{ ...partial.entries[0], geometry: road.geometry }] }
  expect((await request(`${path}/plan`, 'PATCH', { expectedRevision: 0, plan: forged })).status).toBe(400)
  expect(store.get('sandbox', created.id).revision).toBe(0)
  expect((await request(`${path}/plan`, 'PATCH', { expectedRevision: 0, plan: partial })).status).toBe(200)
  expect((await request(`${path}/publish`, 'POST', { expectedRevision: 1 })).status).toBe(200)
  const result = await (await request('public/sandbox/closures?format=geojson')).json()
  expect(result.features[0].properties).toMatchObject({ sourceId: 'synthetic-demo-east', startFraction: .2, endFraction: .8, geometryStatus: 'source-bound-synthetic', publicationVersion: 2 })
  expect(result.features[0].properties).not.toHaveProperty('reference')
})
