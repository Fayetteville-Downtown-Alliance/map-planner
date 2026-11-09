import { expect, it, vi } from 'vitest'
import { inspectLayer } from './index'
const layer = { name: 'Test roads', geometryType: 'esriGeometryPolyline', fields: [{ name: 'OBJECTID', type: 'esriFieldTypeOID' }], extent: { spatialReference: { wkid: 102719, latestWkid: 2264 } }, advancedQueryCapabilities: { supportsPagination: true }, supportedQueryFormats: 'JSON, geoJSON', maxRecordCount: 2000, description: '<script>NEVER RENDER</script>' }
it('inspects allowlisted metadata and returns only an inert field allowlist', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(layer))
  const result = await inspectLayer('fayetteville-streets', fetcher)
  expect(result.objectIdField).toBe('OBJECTID')
  expect(result.sourceCrs).toBe(2264)
  expect(result.rights).toBe('unreviewed')
  expect(JSON.stringify(result)).not.toContain('NEVER RENDER')
  expect(fetcher.mock.calls[0][1]?.redirect).toBe('manual')
})
it('refuses arbitrary URLs before any network request', async () => {
  const fetcher = vi.fn<typeof fetch>()
  await expect(inspectLayer('http://127.0.0.1/private', fetcher)).rejects.toThrow(/Unknown/)
  expect(fetcher).not.toHaveBeenCalled()
})
it('refuses redirects, HTTP-200 ArcGIS errors and incomplete schemas', async () => {
  for (const response of [new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/' } }), Response.json({ error: { code: 499 } }), Response.json({ name: 'Missing fields' })]) {
    await expect(inspectLayer('fayetteville-streets', vi.fn<typeof fetch>().mockResolvedValue(response))).rejects.toThrow()
  }
})
it('enforces response byte limits even without Content-Length', async () => {
  await expect(inspectLayer('fayetteville-streets', vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(1_048_577))))).rejects.toThrow(/limit/)
})
