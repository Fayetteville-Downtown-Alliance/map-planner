import type { EventRecord, Region } from '@map-planner/domain'
export type Source = { id: string; name: string; url: string }
export type Session = { organizationId: string; mode: string; regions: Region[]; referenceSources: Source[] }
export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 0) { super(message) }
}
export async function read<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal })
  let result: unknown
  try { result = await response.json() } catch { throw new ApiError('unreadable_response', `The server response could not be read (HTTP ${response.status}). Keep your draft.`) }
  if (!response.ok) {
    const error = (result as { error?: { code?: string; message?: string } }).error
    throw new ApiError(error?.code ?? 'request_failed', error?.message ?? 'The request failed.', response.status)
  }
  return result as T
}
export type PendingCommand = { id: string; path: string; method: string; body: unknown }
export function receipt(id: string) { return read<EventRecord>(`/api/v1/organizations/sandbox/operations/${encodeURIComponent(id)}`) }
export async function command(pending: PendingCommand): Promise<EventRecord> {
  let response: Response
  try {
    response = await fetch(pending.path, { method: pending.method, headers: { 'Content-Type': 'application/json', 'X-Map-Planner-Sandbox': '1', 'Idempotency-Key': pending.id }, body: JSON.stringify(pending.body), signal: AbortSignal.timeout(15_000) })
  } catch {
    // A timed-out write may have committed. A receipt is the only success evidence.
    try { return await receipt(pending.id) } catch { throw new ApiError('unknown_outcome', 'The response was interrupted. Keep your draft and check the last operation before saving again.') }
  }
  let value: EventRecord & { error?: { code?: string; message?: string } }
  try { value = await response.json() } catch { throw new ApiError('unknown_outcome', 'The write response could not be read. Check its operation receipt before saving again.') }
  if (response.status >= 500) {
    try { return await receipt(pending.id) } catch { throw new ApiError('unknown_outcome', 'The server could not confirm the write. Check its receipt before saving again.') }
  }
  if (!response.ok) throw new ApiError(value.error?.code ?? 'request_failed', value.error?.message ?? 'The request failed. Keep your draft.', response.status)
  return value
}
