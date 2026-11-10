// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { emptyPlan } from '@map-planner/domain'
import { loadDraft, pendingCreationKey, saveDraft, setDraftScope } from './drafts'
afterEach(() => { localStorage.clear(); setDraftScope('local-sandbox') })
it('keeps pending writes and create recovery isolated when a preview session changes', () => {
  setDraftScope('preview-first')
  const firstKey = pendingCreationKey()
  saveDraft('same-event', { version: 1, baseRevision: 3, plan: emptyPlan(), pending: { id: '8aa80014-39af-4136-806b-451620d47f1f', path: '/api/v1/organizations/sandbox/events/same-event/plan', method: 'PATCH', body: { expectedRevision: 3 } } })
  setDraftScope('preview-second')
  expect(loadDraft('same-event')).toBeNull()
  expect(pendingCreationKey()).not.toBe(firstKey)
  setDraftScope('preview-first')
  expect(loadDraft('same-event')?.pending?.body).toEqual({ expectedRevision: 3 })
})
