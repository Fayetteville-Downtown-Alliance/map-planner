import { z } from 'zod'
import { planSchema, restrictionSchema, type Plan } from '@map-planner/domain'
import type { PendingCommand } from './api'
const draftPlan = planSchema.extend({ entries: z.array(restrictionSchema.extend({ label: z.string().max(160), startsAt: z.string().max(160), endsAt: z.string().max(160), parkingStartsAt: z.string().max(160), sourceUrl: z.string().max(500) })).max(32) })
const schema = z.object({ version: z.literal(1), baseRevision: z.number().int().nonnegative(), plan: draftPlan,
  pending: z.object({ id: z.string().uuid(), path: z.string().startsWith('/api/v1/organizations/sandbox/'), method: z.enum(['PATCH','POST']), body: z.unknown() }).nullable(),
}).strict()
export type Draft = { version: 1; baseRevision: number; plan: Plan; pending: PendingCommand | null }
let scope = 'local-sandbox'
export function setDraftScope(value: string) { scope = value }
export function pendingCreationKey() { return scope === 'local-sandbox' ? 'map-planner:sandbox:create-pending' : `map-planner:preview:${scope}:create-pending` }
const key = (id: string) => `map-planner:sandbox:${scope}:${id}:v1`
export function loadDraft(id: string): Draft | null {
  const text = localStorage.getItem(key(id))
  if (!text) return null
  const result = schema.safeParse(JSON.parse(text))
  if (!result.success) throw new Error('An older or unreadable draft is stored. It was not overwritten; keep a copy before clearing site data.')
  return result.data
}
export function saveDraft(id: string, value: Draft) { localStorage.setItem(key(id), JSON.stringify(value)) }
export function clearDraft(id: string) { localStorage.removeItem(key(id)) }
