import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test, type APIRequestContext } from '@playwright/test'
async function createFixture(request: APIRequestContext, title: string) {
  const response = await request.post('/api/v1/organizations/sandbox/events', { headers: { 'X-Map-Planner-Sandbox': '1', 'Idempotency-Key': crypto.randomUUID() }, data: { title, date: '2026-11-20', regionId: 'demo-east' } })
  expect(response.status()).toBe(201)
  return (await response.json()).id as string
}
test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept())
  // Tests exercise real loopback API/database; no upstream City/provider requests.
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    return ['127.0.0.1', 'localhost'].includes(url.hostname) || ['blob:', 'data:'].includes(url.protocol) ? route.continue() : route.abort()
  })
})
test('synthetic plan saves, recovers its draft, publishes a snapshot and withdraws', async ({ page, request }) => {
  const created = await request.post('/api/v1/organizations/sandbox/events', { headers: { 'X-Map-Planner-Sandbox': '1', 'Idempotency-Key': crypto.randomUUID() }, data: { title: `Browser fixture ${test.info().project.name}`, date: '2026-11-20', regionId: 'demo-west' } })
  expect(created.status()).toBe(201)
  const event = await created.json()
  await page.goto(`/?event=${event.id}`)
  await page.getByRole('button', { name: 'Add restriction' }).click()
  await page.getByLabel('Private access instructions (optional)').fill('PRIVATE fixture access note')
  await expect(page.getByText('Unsaved draft', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Recovered your unfinished draft on this device.')).toBeVisible()
  await expect(page.getByLabel('Private access instructions (optional)')).toHaveValue('PRIVATE fixture access note')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page.getByText('Draft saved. The published version has not changed.')).toBeVisible()
  const unpublished = await request.get('/api/v1/public/sandbox/closures?format=geojson')
  expect((await unpublished.json()).features.some((f: { properties: { eventId: string } }) => f.properties.eventId === event.id)).toBe(false)
  await page.getByText('Review and publish a saved plan').click()
  await page.getByLabel('I checked the saved locations, time windows and status.').check()
  await page.getByRole('button', { name: 'Publish reviewed saved plan' }).click()
  await expect(page.getByText('Reviewed version published in the local sandbox.')).toBeVisible()
  const published = await request.get('/api/v1/public/sandbox/closures?format=geojson')
  const data = await published.json()
  expect(data.features.some((f: { properties: { eventId: string } }) => f.properties.eventId === event.id)).toBe(true)
  expect(JSON.stringify(data)).not.toContain('PRIVATE')
  await page.getByLabel('Private planning notes').fill('New draft only')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page.getByText('Draft saved. The published version has not changed.')).toBeVisible()
  const afterEdit = await request.get('/api/v1/public/sandbox/closures?format=geojson')
  expect(afterEdit.headers().etag).toBe(published.headers().etag)
  await page.getByRole('button', { name: 'Withdraw publication' }).click()
  await expect(page.getByText('Publication withdrawn. The saved draft remains available.')).toBeVisible()
  const withdrawn = await request.get('/api/v1/public/sandbox/closures?format=geojson')
  expect((await withdrawn.json()).features.some((f: { properties: { eventId: string } }) => f.properties.eventId === event.id)).toBe(false)
})
test('320px layout keeps written controls usable with reduced motion and map failure', async ({ page, request }) => {
  const id = await createFixture(request, 'Small-screen failure fixture')
  await page.setViewportSize({ width: 320, height: 780 })
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null })
  await page.goto(`/?event=${id}&map=maplibre`)
  await expect(page.getByRole('button', { name: 'Add restriction' })).toBeVisible()
  await page.getByRole('button', { name: 'Add restriction' }).click()
  await expect(page.getByLabel('Location description')).toBeVisible()
  const overflow = () => page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('main *, header *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => ({ tag: e.tagName, text: e.textContent?.slice(0, 70), width: e.getBoundingClientRect().width, right: e.getBoundingClientRect().right })) }))
  const normal = await overflow()
  expect(normal.scroll, JSON.stringify(normal)).toBeLessThanOrEqual(normal.width)
  await page.evaluate(() => { document.documentElement.style.fontSize = '36px' })
  const enlarged = await overflow()
  expect(enlarged.scroll, JSON.stringify(enlarged)).toBeLessThanOrEqual(enlarged.width)
  await expect(page.getByText(/This browser cannot display|Map rendering is unavailable|map component could not load/)).toBeVisible()
  await page.screenshot({ path: `test-results/${test.info().project.name}-320px.png`, fullPage: true, scale: 'css' })
})

test('renders the actual bundled map and local worker before editing', async ({ page, request }) => {
  const id = await createFixture(request, 'Working map fixture')
  await page.goto(`/?event=${id}&map=maplibre`)
  await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready')
  const missing = await request.get('/assets/does-not-exist.js')
  expect(missing.status()).toBe(404)
  expect(missing.headers()['cache-control']).toBe('no-store')
  await page.getByRole('button', { name: 'Add restriction' }).click()
  await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready')
  await expect(page.getByLabel('Location description')).toBeVisible()
  await page.screenshot({ path: `test-results/${test.info().project.name}-map-ready.png`, fullPage: true, scale: 'css' })
})

for (const engine of ['maplibre', 'geoman', 'openlayers']) {
  test(`source-bound curve workflow with ${engine}`, async ({ page, request }) => {
    const id = await createFixture(request, 'GIS renderer comparison')
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(`/?event=${id}&map=${engine}`)
    await expect(page.locator('.map-figure')).toHaveAttribute('data-map-engine', engine)
    await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready', { timeout: 25_000 })
    const initialObservation = await page.evaluate(() => ({
      readyMs: Number(document.querySelector('.map-canvas')?.getAttribute('data-ready-ms')),
      resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, bytes: (r as PerformanceResourceTiming).encodedBodySize })).filter(r => r.name.startsWith('/assets/')),
    }))
    await page.getByRole('combobox', { name: /^Location/ }).selectOption('demo-east-curve')
    await page.getByRole('button', { name: 'Add restriction' }).click()
    const selector = page.getByLabel('Edit reference limits')
    const entryId = await selector.locator('option').nth(1).getAttribute('value')
    await selector.selectOption(entryId!)
    const start = page.getByLabel('Start along reference (%)'), end = page.getByLabel('End along reference (%)')
    await start.fill('20'); await end.fill('80')
    await page.getByRole('button', { name: 'Cancel limit preview' }).click()
    await expect(start).toHaveValue('0'); await expect(end).toHaveValue('100')
    await start.fill('25'); await end.fill('75')
    await page.getByRole('button', { name: 'Apply limits to draft' }).click()
    await page.getByRole('button', { name: 'Undo last applied limits' }).click()
    await expect(start).toHaveValue('0'); await expect(end).toHaveValue('100')
    await start.fill('80'); await end.fill('20')
    await page.getByRole('button', { name: 'Apply limits to draft' }).click()
    await expect(page.getByText('Enter start and end within 0–100%, with start before end.')).toBeVisible()
    await start.fill('20'); await end.fill('80')
    await page.getByRole('button', { name: 'Apply limits to draft' }).click()
    if (test.info().project.name === 'desktop-chromium' && engine !== 'maplibre') {
      await page.locator('.map-canvas').scrollIntoViewIfNeeded()
      let handle: { x: number; y: number }
      if (engine === 'geoman') {
        const box = await page.locator('.map-canvas').boundingBox()
        expect(box).not.toBeNull()
        const screenshot = await page.locator('.map-canvas').screenshot({ scale: 'css' })
        handle = await page.evaluate(async ({ data, box }) => {
          const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode()
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
          const context = canvas.getContext('2d')!; context.drawImage(image,0,0)
          const pixels = context.getImageData(0,0,canvas.width,canvas.height).data
          const points: {x:number;y:number}[] = []
          for (let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) {
            const i=(y*canvas.width+x)*4
            if (pixels[i]<80 && pixels[i+1]>90 && pixels[i+2]>180 && pixels[i+2]>pixels[i+1]+30) points.push({x,y})
          }
          if (!points.length) throw Error('No rendered Geoman handle found')
          const left = Math.min(...points.map(p=>p.x)), cluster = points.filter(p=>p.x < left+24)
          return { x: box.x+cluster.reduce((n,p)=>n+p.x,0)/cluster.length,
            y: box.y+cluster.reduce((n,p)=>n+p.y,0)/cluster.length }
        }, { data: screenshot.toString('base64'), box: box! })
      } else {
        // Find the actual rendered start handle in the local, untainted canvas.
        // This observes pixels; it does not call an internal map/test-only API.
        handle = await page.locator('.map-canvas').evaluate(root => {
          for (const canvas of root.querySelectorAll('canvas')) {
            const context = canvas.getContext('2d')
            if (!context) continue
            const pixels = context.getImageData(0,0,canvas.width,canvas.height).data
            const points: { x: number; y: number }[] = []
            for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) {
              const i=(y*canvas.width+x)*4
              if (pixels[i]===21 && pixels[i+1]===60 && pixels[i+2]===65 && pixels[i+3]===255) points.push({x,y})
            }
            if (!points.length) continue
            const left = Math.min(...points.map(p=>p.x))
            const cluster = points.filter(p=>p.x < left+24)
            const box = canvas.getBoundingClientRect()
            return { x: box.x+cluster.reduce((n,p)=>n+p.x,0)/cluster.length*box.width/canvas.width,
              y: box.y+cluster.reduce((n,p)=>n+p.y,0)/cluster.length*box.height/canvas.height }
          }
          throw Error('No rendered limit handle found')
        })
      }
      await page.mouse.move(handle.x, handle.y)
      await page.mouse.down()
      await page.mouse.move(handle.x+12, handle.y-9, { steps: 12 })
      await page.mouse.up()
      await expect(start).not.toHaveValue('20')
      const gestured = Number(await start.inputValue())
      expect(gestured).toBeGreaterThan(20); expect(gestured).toBeLessThan(80)
      // A gesture is a preview; cancel restores the applied draft limits.
      await page.getByRole('button', { name: 'Cancel limit preview' }).click()
      await expect(start).toHaveValue('20'); await expect(end).toHaveValue('80')
    }
    await page.getByLabel('Private access instructions (optional)').fill('PRIVATE GIS fixture')
    await page.getByRole('button', { name: 'Save draft', exact: true }).click()
    await expect(page.getByText('Draft saved. The published version has not changed.')).toBeVisible()
    await page.reload()
    await expect(page.locator('.map-figure')).toHaveAttribute('data-map-state', 'ready', { timeout: 25_000 })
    await page.getByLabel('Edit reference limits').selectOption(entryId!)
    await expect(start).toHaveValue('20'); await expect(end).toHaveValue('80')
    await page.getByText('Review and publish a saved plan').click()
    await page.getByLabel('I checked the saved locations, time windows and status.').check()
    await page.getByRole('button', { name: 'Publish reviewed saved plan' }).click()
    await expect(page.getByText('Reviewed version published in the local sandbox.')).toBeVisible()
    const data = await (await request.get('/api/v1/public/sandbox/closures?format=geojson')).json()
    const feature = data.features.find((f: { properties: { eventId: string } }) => f.properties.eventId === id)
    expect(feature.geometry.type).toBe('LineString')
    expect(feature.geometry.coordinates).toHaveLength(4)
    expect(feature.properties).toMatchObject({ sourceId: 'synthetic-demo-east', featureId: 'demo-east-curve', startFraction: .2, endFraction: .8, geometryStatus: 'source-bound-synthetic' })
    expect(JSON.stringify(feature)).not.toContain('PRIVATE')
    const metrics = await page.evaluate(() => ({
      readyMs: Number(document.querySelector('.map-canvas')?.getAttribute('data-ready-ms')),
      resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, bytes: (r as PerformanceResourceTiming).encodedBodySize })).filter(r => r.name.startsWith('/assets/')),
    }))
    await mkdir(test.info().outputDir, { recursive: true })
    const observationPath = test.info().outputPath('renderer-observation.json')
    await writeFile(observationPath, JSON.stringify({ engine, project: test.info().project.name, cache: 'fresh-context-then-reload-after-identical-edit-workflow', initial: initialObservation, reload: metrics }, null, 2))
    await test.info().attach('renderer-observation.json', { path: observationPath, contentType: 'application/json' })
    expect(errors).toEqual([])
    await page.screenshot({ path: `test-results/${test.info().project.name}-${engine}-limits.png`, fullPage: true, scale: 'css' })
  })
}
