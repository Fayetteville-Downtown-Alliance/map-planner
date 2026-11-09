// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { randomUUID } from 'node:crypto'
import { App } from './App'
import { createApp } from '../../api/src/app'
import { PlannerStore } from '../../api/src/store'
import { emptyPlan } from '@map-planner/domain'
vi.mock('./PlanMap', () => ({ PlanMap: () => <p>Map fixture; use the actual written editor controls.</p> }))
let store: PlannerStore
let app: ReturnType<typeof createApp>
beforeEach(() => {
  localStorage.clear(); window.history.replaceState({}, '', '/')
  store = new PlannerStore(':memory:'); store.seed(); app = createApp(store, { sandbox: true })
  vi.stubGlobal('fetch', (path: string, init?: RequestInit) => app.request(new URL(path, 'http://127.0.0.1:8788').href, init))
})
afterEach(() => { cleanup(); store.close(); vi.unstubAllGlobals() })
it('saves a real API plan and requires explicit review before a separate publication', async () => {
  const user = userEvent.setup(); render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Add restriction' }))
  await user.type(screen.getByLabelText('Private access instructions (optional)'), 'private delivery details')
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  await screen.findByText('Draft saved. The published version has not changed.')
  expect(store.list('sandbox')[0].plan.entries).toHaveLength(1)
  expect(store.list('sandbox')[0].publication).toBeNull()
  await user.click(screen.getByText('Review and publish a saved plan'))
  await user.click(screen.getByLabelText('I checked the saved locations, time windows and status.'))
  await user.click(screen.getByRole('button', { name: 'Publish reviewed saved plan' }))
  await screen.findByText('Reviewed version published in the local sandbox.')
  expect(store.list('sandbox')[0].publication?.plan.entries).toHaveLength(1)
  const response = await app.request('http://127.0.0.1:8788/api/v1/public/sandbox/closures?format=geojson')
  expect(await response.text()).not.toContain('private delivery')
})
it('restores incomplete unsaved fields after remount instead of silently losing them', async () => {
  const user = userEvent.setup(); const mounted = render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Add restriction' }))
  await user.clear(screen.getByLabelText('Restrictions start'))
  await user.clear(screen.getByLabelText('Location description'))
  await user.type(screen.getByLabelText('Location description'), 'X')
  await waitFor(() => expect(localStorage.getItem(localStorage.key(0)!)).toContain('"label":"X"'))
  mounted.unmount(); render(<App />)
  await screen.findByText('Recovered your unfinished draft on this device.')
  expect((screen.getByLabelText('Location description') as HTMLInputElement).value).toBe('X')
  expect((screen.getByLabelText('Restrictions start') as HTMLInputElement).value).toBe('')
})
it('preserves the client draft after a real stale-save conflict', async () => {
  const user = userEvent.setup(); render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Add restriction' }))
  const event = store.list('sandbox')[0]
  store.update('sandbox', event.id, randomUUID(), 0, 'save', { ...emptyPlan(), notes: 'Another editor changed this.' })
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  await screen.findByText(/This event changed elsewhere/)
  expect(screen.getByLabelText('Location description')).toBeTruthy()
  expect(store.get('sandbox', event.id).plan.notes).toBe('Another editor changed this.')
  await user.click(screen.getByRole('button', { name: 'Compare latest saved version' }))
  await screen.findByRole('heading', { name: 'Saved revision 1' })
})
it('recovers an accepted write by receipt when its response is interrupted', async () => {
  let failed = false
  vi.stubGlobal('fetch', async (path: string, init?: RequestInit) => {
    const result = await app.request(new URL(path, 'http://127.0.0.1:8788').href, init)
    if (init?.method === 'PATCH' && !failed) { failed = true; throw new TypeError('Simulated connection lost after commit') }
    return result
  })
  const user = userEvent.setup(); render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Add restriction' }))
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  await screen.findByText('Draft saved. The published version has not changed.')
  expect(store.list('sandbox')[0].revision).toBe(1)
  expect(failed).toBe(true)
})
