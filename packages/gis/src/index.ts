/** Read-only metadata inspection. This module never imports features or writes upstream. */
export const referenceSources = [
  { id: 'fayetteville-streets', name: 'City street centerlines', url: 'https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/Streets/MapServer/0' },
  { id: 'fayetteville-addresses', name: 'City address points', url: 'https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/AddressPoints/MapServer/0' },
  { id: 'fayetteville-curb-zones', name: 'City public parking curb zones', url: 'https://services.arcgis.com/j3zNT485kmwrBtMJ/arcgis/rest/services/Parking_Map_Public_View/FeatureServer/3' },
] as const
export type SourceId = typeof referenceSources[number]['id']
export type LayerMetadata = {
  sourceId: string; url: string; name: string; geometryType: string; sourceCrs: number | null;
  objectIdField: string | null; globalIdField: string | null;
  maxRecordCount: number | null; supportsPagination: boolean; formats: string[];
  fields: { name: string; type: string }[]; retrievedAt: string; rights: 'unreviewed';
}
export async function inspectLayer(sourceId: string, fetcher: typeof fetch = fetch): Promise<LayerMetadata> {
  const source = referenceSources.find(x => x.id === sourceId)
  if (!source) throw new Error('Unknown approved reference source.')
  const response = await fetcher(`${source.url}?f=json`, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { Accept: 'application/json' } })
  if (!response.ok || response.status >= 300) throw new Error(`Source metadata is unavailable (HTTP ${response.status}).`)
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Source returned no metadata.')
  let bytes = 0
  const chunks: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 1_048_576) throw new Error('Source metadata exceeded the 1 MiB limit.')
      chunks.push(value)
    }
  } finally { await reader.cancel().catch(() => {}) }
  const joined = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.length }
  const raw: unknown = JSON.parse(new TextDecoder().decode(joined))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Source metadata is not a layer object.')
  const d = raw as Record<string, unknown>
  if (d.error) throw new Error('ArcGIS reported an error; the source has not been accepted.')
  if (typeof d.name !== 'string' || typeof d.geometryType !== 'string' || !Array.isArray(d.fields) || d.fields.length > 500) throw new Error('Source layer schema is incomplete.')
  const fields = d.fields.map((f: unknown) => {
    if (!f || typeof f !== 'object' || !('name' in f) || !('type' in f) || typeof f.name !== 'string' || typeof f.type !== 'string' || f.name.length > 160) throw new Error('Source field schema is invalid.')
    return { name: f.name, type: f.type }
  })
  const extent = d.extent as { spatialReference?: { wkid?: number; latestWkid?: number } } | undefined
  const sr = (d.spatialReference ?? extent?.spatialReference) as { wkid?: number; latestWkid?: number } | undefined
  const query = d.advancedQueryCapabilities as { supportsPagination?: boolean } | undefined
  return { sourceId, url: source.url, name: d.name.slice(0, 300), geometryType: d.geometryType.slice(0, 100), sourceCrs: sr?.latestWkid ?? sr?.wkid ?? null,
    objectIdField: typeof d.objectIdField === 'string' ? d.objectIdField : fields.find(f => f.type === 'esriFieldTypeOID')?.name ?? null,
    globalIdField: typeof d.globalIdField === 'string' ? d.globalIdField : fields.find(f => f.type === 'esriFieldTypeGlobalID')?.name ?? null,
    maxRecordCount: typeof d.maxRecordCount === 'number' ? d.maxRecordCount : null, supportsPagination: query?.supportsPagination === true,
    formats: typeof d.supportedQueryFormats === 'string' ? d.supportedQueryFormats.split(',').map(x => x.trim()) : [],
    fields, retrievedAt: new Date().toISOString(), rights: 'unreviewed' }
}
