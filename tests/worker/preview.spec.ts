import { expect, test } from '@playwright/test'

test('isolates browser workspaces, denies forged sessions and preserves transactional receipts', async ({ playwright, baseURL }) => {
  const first = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: !process.env.MAP_PLANNER_PREVIEW_URL }), second = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: !process.env.MAP_PLANNER_PREVIEW_URL })
  try {
    expect((await first.get('/')).status()).toBe(200)
    expect((await second.get('/')).status()).toBe(200)
    const a = await (await first.get('/api/v1/session')).json(), b = await (await second.get('/api/v1/session')).json()
    expect(a.mode).toBe('isolated-synthetic-preview'); expect(a.draftScope).not.toBe(b.draftScope)
    const operationId = crypto.randomUUID(), headers = { 'X-Map-Planner-Sandbox': '1', 'Idempotency-Key': operationId }
    const data = { title: 'Isolated preview fixture', date: '2026-11-20', regionId: 'demo-east' }
    const created = await first.post('/api/v1/organizations/sandbox/events', { headers, data })
    expect(created.status()).toBe(201)
    const event = await created.json()
    expect((await second.get(`/api/v1/organizations/sandbox/events/${event.id}`)).status()).toBe(404)
    expect((await second.get(`/api/v1/organizations/sandbox/operations/${operationId}`)).status()).toBe(404)
    expect((await (await first.post('/api/v1/organizations/sandbox/events', { headers, data })).json()).id).toBe(event.id)
    expect((await first.post('/api/v1/organizations/sandbox/events', { headers, data: { ...data, title: 'Different body' } })).status()).toBe(409)
    expect((await first.patch(`/api/v1/organizations/sandbox/events/${event.id}/plan`, { headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() }, data: { expectedRevision: 4, plan: { version: 1, entries: [], notes: '', noRoadClosuresConfirmed: false } } })).status()).toBe(409)
    expect((await first.get('/api/v1/reference-sources/fayetteville-streets/metadata')).status()).toBe(403)
    expect((await first.get('/api/v1/session', { headers: { Origin: 'https://untrusted.example' } })).status()).toBe(403)
    const forged = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: !process.env.MAP_PLANNER_PREVIEW_URL, extraHTTPHeaders: { Cookie: '__Host-mapplanner_preview=v1.'+'0'.repeat(64)+'.1800000000.'+'0'.repeat(64) } })
    expect((await forged.get('/api/v1/organizations/sandbox/events')).status()).toBe(401)
    await forged.dispose()
    const missing = await first.get('/assets/not-an-asset.js'); expect(missing.status()).toBe(404); expect(missing.headers()['cache-control']).toBe('no-store')
  } finally { await first.dispose(); await second.dispose() }
})
test('hosted preview edits, recovers, publishes and withdraws its own synthetic plan', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByText('Hosted preview', { exact: true })).toBeVisible()
  await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready')
  for (const engine of ['geoman', 'maplibre', 'openlayers']) {
    await page.getByLabel('Map renderer').selectOption(engine)
    await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready', { timeout: 20000 })
  }
  await page.getByRole('button', { name: 'Add restriction' }).click()
  await page.getByLabel('Private access instructions (optional)').fill('PRIVATE PREVIEW SENTINEL')
  await page.reload()
  await expect(page.getByLabel('Private access instructions (optional)')).toHaveValue('PRIVATE PREVIEW SENTINEL')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page.getByText('Draft saved. The published version has not changed.')).toBeVisible()
  await page.getByText('Review and publish a saved plan').click()
  await page.getByLabel('I checked the saved locations, time windows and status.').check()
  await page.getByRole('button', { name: 'Publish reviewed saved plan' }).click()
  await expect(page.getByText('Reviewed version published in your preview workspace.')).toBeVisible()
  const published = await context.request.get('/api/v1/public/sandbox/closures?format=geojson')
  const snapshot = await published.json(); expect(snapshot.features.length).toBe(1); expect(JSON.stringify(snapshot)).not.toContain('PRIVATE')
  await page.getByRole('button', { name: 'Withdraw publication' }).click()
  await expect(page.getByText('Publication withdrawn. The saved draft remains available.')).toBeVisible()
  expect((await (await context.request.get('/api/v1/public/sandbox/closures?format=geojson')).json()).features).toHaveLength(0)
  await page.screenshot({ path: `worker-test-results/${test.info().project.name}-hosted-preview.png`, fullPage: true, scale: 'css' })
})
