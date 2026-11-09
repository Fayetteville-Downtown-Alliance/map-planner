import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { PlannerStore } from './store'
import { createApp } from './app'
if (process.env.LOCAL_SANDBOX !== '1' || process.env.NODE_ENV === 'production') {
  throw new Error('Set LOCAL_SANDBOX=1 for synthetic local development. Production mode is not supported.')
}
const path = resolve(process.env.MAP_PLANNER_DB || '.data/planner.sqlite')
mkdirSync(dirname(path), { recursive: true })
const store = new PlannerStore(path)
store.seed()
const app = createApp(store, { sandbox: true })
app.use('/*', serveStatic({ root: './dist/web' }))
app.get('*', serveStatic({ path: './dist/web/index.html' }))
const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 8788 }, () => console.log('Map Planner synthetic sandbox: http://127.0.0.1:8788 (outbound delivery disabled)'))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => { store.close(); process.exit(0) }))
