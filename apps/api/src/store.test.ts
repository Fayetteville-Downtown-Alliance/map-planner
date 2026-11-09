import { expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { PlannerStore } from './store'
import { emptyPlan } from '@map-planner/domain'
it('retains data and receipts after restart and rejects a second connection stale write', () => {
  const directory = mkdtempSync(join(tmpdir(), 'map-planner-store-'))
  const path = join(directory, 'test.sqlite')
  let first: PlannerStore | undefined
  let second: PlannerStore | undefined
  try {
    first = new PlannerStore(path)
    const key = randomUUID()
    const event = first.create('sandbox', key, { title: 'Persistence fixture', date: '2026-11-20', regionId: 'demo-west' })
    first.close(); first = new PlannerStore(path)
    second = new PlannerStore(path)
    expect(first.receipt('sandbox', key).id).toBe(event.id)
    first.update('sandbox', event.id, randomUUID(), 0, 'save', { ...emptyPlan(), notes: 'Accepted revision' })
    expect(() => second!.update('sandbox', event.id, randomUUID(), 0, 'save', emptyPlan())).toThrow(/changed elsewhere/)
    expect(second.get('sandbox', event.id).plan.notes).toBe('Accepted revision')
  } finally { first?.close(); second?.close(); rmSync(directory, { recursive: true, force: true }) }
})
