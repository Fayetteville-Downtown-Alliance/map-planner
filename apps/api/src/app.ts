import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { day, eventInputSchema, publicEvents, geoJSON, regions, roadsFor } from '@map-planner/domain'
import { inspectLayer, referenceSources } from '@map-planner/gis'
import { PlannerStore, StoreError } from './store'

const operationIdSchema = z.string().uuid()
const revisionSchema = z.number().int().nonnegative()
export function createApp(store: PlannerStore, options: { sandbox: boolean; fetcher?: typeof fetch }) {
  if (!options.sandbox) throw new Error('Only the local synthetic sandbox is supported. Production authentication is not implemented.')
  const app = new Hono()
  app.use('/api/*', async (c, next) => {
    const url = new URL(c.req.url)
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return c.json({ error: { code: 'sandbox_host', message: 'This sandbox accepts loopback requests only.' } }, 403)
    // Never trust forwarded identity/host headers. The only principal is a local synthetic workspace.
    const origin = c.req.header('origin')
    if (origin && !['http://127.0.0.1:5178', 'http://localhost:5178', 'http://127.0.0.1:8788', 'http://localhost:8788'].includes(origin)) {
      return c.json({ error: { code: 'sandbox_origin', message: 'This origin cannot access the local sandbox.' } }, 403)
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      if (c.req.header('X-Map-Planner-Sandbox') !== '1') return c.json({ error: { code: 'sandbox_header', message: 'The local sandbox request header is required.' } }, 403)
      if (!c.req.header('content-type')?.startsWith('application/json')) return c.json({ error: { code: 'content_type', message: 'Send JSON content.' } }, 415)
    }
    c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Request-Id', randomUUID())
    await next()
  })
  app.use('/api/*', bodyLimit({ maxSize: 128 * 1024, onError: c => c.json({ error: { code: 'body_limit', message: 'Request exceeds 128 KiB.' } }, 413) }))
  app.get('/api/health', c => c.json({ status: 'ok', mode: 'local-synthetic-sandbox', version: '0.1.0-alpha.1', outboundDelivery: false }))
  app.get('/api/v1/session', c => c.json({ organizationId: 'sandbox', actorId: 'local-sandbox', mode: 'local-synthetic-sandbox', productionAuthentication: false, regions, referenceSources }))
  const orgPath = '/api/v1/organizations/:org'
  app.use(`${orgPath}/*`, async (c, next) => {
    if (c.req.param('org') !== 'sandbox') return c.json({ error: { code: 'not_found', message: 'This workspace is not available.' } }, 404)
    await next()
  })
  app.get(`${orgPath}/events`, c => c.json({ events: store.list('sandbox') }))
  app.post(`${orgPath}/events`, async c => {
    const id = operationIdSchema.parse(c.req.header('Idempotency-Key'))
    const input = eventInputSchema.parse(await c.req.json())
    return c.json(store.create('sandbox', id, input), 201)
  })
  app.get(`${orgPath}/events/:event`, c => c.json(store.get('sandbox', c.req.param('event'))))
  app.get(`${orgPath}/operations/:operation`, c => c.json(store.receipt('sandbox', operationIdSchema.parse(c.req.param('operation')))))
  app.patch(`${orgPath}/events/:event/plan`, async c => {
    const id = operationIdSchema.parse(c.req.header('Idempotency-Key'))
    const body = z.object({ expectedRevision: revisionSchema, plan: z.unknown() }).strict().parse(await c.req.json())
    return c.json(store.update('sandbox', c.req.param('event'), id, body.expectedRevision, 'save', body.plan))
  })
  for (const action of ['publish', 'withdraw'] as const) {
    app.post(`${orgPath}/events/:event/${action}`, async c => {
      const id = operationIdSchema.parse(c.req.header('Idempotency-Key'))
      const body = z.object({ expectedRevision: revisionSchema }).strict().parse(await c.req.json())
      return c.json(store.update('sandbox', c.req.param('event'), id, body.expectedRevision, action))
    })
  }
  app.get('/api/v1/regions/:region/roads', c => {
    const region = regions.find(r => r.id === c.req.param('region'))
    return region ? c.json({ region, roads: roadsFor(region), source: 'Original synthetic geometry, not an official street dataset.' }) : c.json({ error: { code: 'not_found', message: 'Unknown region.' } }, 404)
  })
  app.get('/api/v1/public/:org/closures', c => {
    if (c.req.param('org') !== 'sandbox') return c.json({ error: { code: 'not_found', message: 'Unknown public workspace.' } }, 404)
    const query = z.object({ date: day.optional(), format: z.enum(['json', 'geojson']).optional() }).strict().parse(c.req.query())
    const events = publicEvents(store.list('sandbox'), query.date)
    const payload = query.format === 'geojson' ? geoJSON(events) : { mode: 'synthetic', date: query.date ?? null, events }
    const content = JSON.stringify(payload)
    const etag = `"${createHash('sha256').update(content).digest('hex')}"`
    c.header('ETag', etag)
    if (c.req.header('If-None-Match') === etag) return c.body(null, 304)
    return c.body(content, 200, { 'Content-Type': query.format === 'geojson' ? 'application/geo+json; charset=utf-8' : 'application/json; charset=utf-8' })
  })
  app.get('/api/v1/reference-sources/:source/metadata', async c => {
    if (!referenceSources.some(s => s.id === c.req.param('source'))) return c.json({ error: { code: 'not_found', message: 'Unknown approved source.' } }, 404)
    try { return c.json(await inspectLayer(c.req.param('source'), options.fetcher)) }
    catch { return c.json({ error: { code: 'source_unavailable', message: 'Source metadata could not be read. Your plan is unchanged; try again later.' } }, 502) }
  })
  app.get('/api/v1/openapi.json', c => c.json({
    openapi: '3.1.0', info: { title: 'Map Planner local sandbox API', version: '0.1.0-alpha.1', description: 'Synthetic loopback sandbox only. No production authentication, notifications or upstream GIS writes.' },
    servers: [{ url: 'http://127.0.0.1:8788' }],
    paths: {
      '/api/health': { get: { responses: { '200': { description: 'Sandbox health and outbound-delivery state.' } } } },
      '/api/v1/public/{org}/closures': { get: { parameters: [
        { name: 'org', in: 'path', required: true, schema: { type: 'string', const: 'sandbox' } },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'geojson'] } },
      ], responses: { '200': { description: 'Published synthetic restrictions only; Point/LineString/null geometry; local and UTC times.' }, '304': { description: 'Reuse the previous representation.' }, '400': { description: 'Invalid date, format or unknown query parameter.' } } } },
    },
  }))
  app.all('/api/*', c => c.json({ error: { code: 'not_found', message: 'This API route is not available.' } }, 404))
  app.onError((error, c) => {
    if (error instanceof StoreError) return c.json({ error: { code: error.code, message: error.message } }, error.status as 400 | 404 | 409)
    if (error instanceof z.ZodError) return c.json({ error: { code: 'validation', message: error.issues.map(i => `${i.path.join('.') || 'Request'}: ${i.message}`).join(' ') } }, 400)
    if (error instanceof SyntaxError) return c.json({ error: { code: 'invalid_json', message: 'Send valid JSON.' } }, 400)
    if (error instanceof RangeError || (error instanceof Error && /Each restriction|Confirmed no restrictions|reopening must|parking restrictions/.test(error.message))) return c.json({ error: { code: 'validation', message: error.message } }, 400)
    console.error('[map-planner] Request failed', { name: error.name })
    return c.json({ error: { code: 'internal_error', message: 'The request failed. Keep your draft and check its operation receipt before retrying.' } }, 500)
  })
  return app
}
