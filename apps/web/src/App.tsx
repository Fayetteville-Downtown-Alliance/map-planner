import { useEffect, useMemo, useState } from 'react'
import { anchorFor, emptyPlan, regions, roadsFor, type EventRecord, type Plan, type Region, type Restriction } from '@map-planner/domain'
import { ApiError, command, read, receipt, type PendingCommand, type Session } from './api'
import { clearDraft, loadDraft, saveDraft } from './drafts'
import { ReferenceWorkbench } from './ReferenceWorkbench'

const root = '/api/v1/organizations/sandbox'
const impactNames = { full: 'Closed to traffic', lane: 'Lane restriction', parking: 'Parking only' }
const statusNames = { planned: 'Planned · unconfirmed', confirmed: 'Confirmed in this demonstration', cancelled: 'Cancelled' }
function message(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Keep your draft and try again.' }
function useView() {
  const params = new URLSearchParams(window.location.search)
  return { view: params.get('view') ?? 'planner', eventId: params.get('event') }
}
export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState('')
  const { view, eventId } = useView()
  useEffect(() => {
    const controller = new AbortController()
    void Promise.all([read<Session>('/api/v1/session', controller.signal), read<{ events: EventRecord[] }>(`${root}/events`, controller.signal)]).then(([s, result]) => {
      setSession(s); setEvents(result.events)
    }).catch(e => { if (!controller.signal.aborted) setError(message(e)) })
    return () => controller.abort()
  }, [])
  const selected = events.find(e => e.id === eventId) ?? (!eventId ? events[0] : undefined)
  return <>
    <a className="skip-link" href="#main">Skip to workspace</a>
    <header className="app-header"><a className="wordmark" href="/">Map Planner</a><nav aria-label="Main navigation">
      <a href="/" aria-current={view === 'planner' ? 'page' : undefined}>Planner</a>
      <a href="/?view=sources" aria-current={view === 'sources' ? 'page' : undefined}>Data sources</a>
      <a href="/?view=developers" aria-current={view === 'developers' ? 'page' : undefined}>Developer API</a>
    </nav><span className="sandbox-badge">Local sandbox</span></header>
    <div className="sandbox-notice">Synthetic plans and fictitious streets. Nothing here is an official closure notice.</div>
    <main id="main" tabIndex={-1}>
      {error ? <section className="page"><h1>Workspace unavailable</h1><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Try loading again</button></section>
        : !session ? <p className="page" role="status">Loading your local workspace…</p>
        : view === 'sources' ? <Sources sources={session.referenceSources} />
        : view === 'developers' ? <Developer />
        : <div className="workspace"><aside className="sidebar" aria-label="Events"><h2>Your events</h2><p className="muted">Plan street impacts, then review a saved version.</p>
          <ul className="event-list">{events.map(event => <li key={event.id}><a href={`/?event=${event.id}`} aria-current={selected?.id === event.id ? 'page' : undefined}><strong>{event.title}</strong><span>{event.date} · {event.plan.entries.length} restrictions</span><span>{event.publication ? `Published version ${event.publication.version}` : 'Draft only'}</span></a></li>)}</ul>
          <NewEvent />
        </aside><section className="editor-space">{selected ? <Editor key={selected.id} initial={selected} onSaved={updated => setEvents(current => current.map(e => e.id === updated.id ? updated : e))} /> : <><h1>{eventId ? 'Event unavailable' : 'Start a street plan'}</h1><p>{eventId ? 'This event is not in the local workspace. Choose an event from the list.' : 'Create a demonstration event to begin.'}</p></>}</section></div>}
    </main>
    <footer className="app-footer">Map Planner · Development sandbox · Reference data rights and production identity remain separate work.</footer>
  </>
}
function NewEvent() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-11-20')
  const [regionId, setRegionId] = useState('demo-east')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<PendingCommand | null>(() => {
    try { const raw = localStorage.getItem('map-planner:sandbox:create-pending'); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  async function finish(result: EventRecord) { localStorage.removeItem('map-planner:sandbox:create-pending'); window.location.assign(`/?event=${result.id}`) }
  return <details className="new-event"><summary>Create an event</summary><form onSubmit={async e => {
    e.preventDefault(); setError(''); setBusy(true)
    const attempt: PendingCommand = { id: crypto.randomUUID(), path: `${root}/events`, method: 'POST', body: { title, date, regionId } }
    try {
      localStorage.setItem('map-planner:sandbox:create-pending', JSON.stringify(attempt)); setPending(attempt)
      await finish(await command(attempt))
    } catch (error) {
      setError(message(error))
      if (error instanceof ApiError && error.code !== 'unknown_outcome') { localStorage.removeItem('map-planner:sandbox:create-pending'); setPending(null) }
    } finally { setBusy(false) }
  }}>
    <label>Event title<input required minLength={2} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
    <label>Event date<input required type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
    <label>Demonstration region<select value={regionId} onChange={e => setRegionId(e.target.value)}>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
    <button type="submit" disabled={busy || !!pending}>{busy ? 'Creating…' : 'Create draft event'}</button>
    {pending && <><p role="status">The last create needs a receipt check before another event can be created.</p><button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await finish(await receipt(pending.id)) } catch (e) { setError(message(e)) } finally { setBusy(false) } }}>Check last create</button></>}
    {error && <p role="alert" className="error">{error}</p>}
  </form></details>
}
function initialState(event: EventRecord) {
  try { return { draft: loadDraft(event.id), error: '' } } catch (error) { return { draft: null, error: message(error) } }
}
function Editor({ initial, onSaved }: { initial: EventRecord; onSaved: (record: EventRecord) => void }) {
  const [restored] = useState(() => initialState(initial))
  const [event, setEvent] = useState(initial)
  const [plan, setPlan] = useState<Plan>(restored.draft?.plan ?? initial.plan)
  const [baseRevision, setBaseRevision] = useState(restored.draft?.baseRevision ?? initial.revision)
  const [pending, setPending] = useState<PendingCommand | null>(restored.draft?.pending ?? null)
  const [storageError, setStorageError] = useState(restored.error)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(restored.draft ? 'Recovered your unfinished draft on this device.' : '')
  const [busy, setBusy] = useState(false)
  const [latest, setLatest] = useState<EventRecord | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const region = regions.find(r => r.id === event.regionId)!
  const roads = useMemo(() => roadsFor(region), [region.id])
  const [roadId, setRoadId] = useState(roads[0].id)
  const dirty = JSON.stringify(plan) !== JSON.stringify(event.plan)
  useEffect(() => {
    if (restored.error) return // Preserve incompatible stored drafts until explicitly handled.
    try { saveDraft(event.id, { version: 1, baseRevision, plan, pending }); setStorageError('') }
    catch { setStorageError('Device draft storage is unavailable. Copy your written work before leaving this page.') }
  }, [event.id, baseRevision, plan, pending, restored.error])
  useEffect(() => { setReviewed(false) }, [event.revision, dirty])
  useEffect(() => {
    if (!dirty && !pending) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, pending])
  function adopt(result: EventRecord) {
    setEvent(result); onSaved(result); setBaseRevision(result.revision); setPlan(result.plan); setPending(null); setLatest(null)
    clearDraft(result.id)
  }
  async function perform(action: 'save' | 'publish' | 'withdraw') {
    setError(''); setNotice(''); setBusy(true)
    const attempt: PendingCommand = { id: crypto.randomUUID(), path: `${root}/events/${event.id}/${action === 'save' ? 'plan' : action}`, method: action === 'save' ? 'PATCH' : 'POST', body: { expectedRevision: baseRevision, ...(action === 'save' ? { plan } : {}) } }
    try {
      // Store the exact queued snapshot BEFORE sending, so reload cannot create a new operation.
      saveDraft(event.id, { version: 1, baseRevision, plan, pending: attempt }); setPending(attempt)
      const result = await command(attempt)
      adopt(result); setNotice(action === 'save' ? 'Draft saved. The published version has not changed.' : action === 'publish' ? 'Reviewed version published in the local sandbox.' : 'Publication withdrawn. The saved draft remains available.')
    } catch (e) {
      setError(message(e))
      if (e instanceof ApiError && e.code !== 'unknown_outcome') setPending(null)
    } finally { setBusy(false) }
  }
  function addRestriction() {
    const road = roads.find(r => r.id === roadId)
    const entry: Restriction = { id: crypto.randomUUID(), label: road?.label ?? 'Written location — review limits', referenceId: road?.id ?? '', geometry: road?.geometry ?? null, ...(road ? { reference: anchorFor(region, road) } : {}), impact: 'full', status: 'planned', direction: 'both',
      startsAt: `${event.date}T09:00`, endsAt: `${event.date}T17:00`, parkingStartsAt: '', accessNotes: '', sourceUrl: '', detour: '' }
    setPlan(value => ({ ...value, entries: [...value.entries, entry], noRoadClosuresConfirmed: false }))
  }
  function change(id: string, patch: Partial<Restriction>) { setPlan(value => ({ ...value, entries: value.entries.map(item => item.id === id ? { ...item, ...patch } : item) })) }
  return <>
    <div className="page-title"><div><p className="context">{region.name} · {event.date}</p><h1>{event.title}</h1><p className="muted">All restriction times use {region.timeZone}. Boundaries here are illustrative.</p></div><span className="state-label">{dirty ? 'Unsaved draft' : `Saved revision ${event.revision}`}</span></div>
    {storageError && <p role="alert" className="error">{storageError}</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {notice && <p role="status" className="notice">{notice}</p>}
    {pending && <section className="recovery"><h2>Check the last operation</h2><p>It may already have completed. Your draft and operation ID are preserved; another save is paused.</p><button disabled={busy} onClick={async () => { setBusy(true); try { adopt(await receipt(pending.id)); setNotice('The accepted operation was recovered.') } catch (e) { setError(message(e)) } finally { setBusy(false) } }}>Check operation receipt</button></section>}
    {(baseRevision !== event.revision || error.includes('elsewhere')) && <p className="notice">Your draft started at revision {baseRevision}; the saved event is revision {event.revision}. Compare before applying it.</p>}
    <div className="map-heading"><h2>Draft map</h2><span>{plan.entries.filter(e => e.status !== 'cancelled').length} active restrictions</span></div>
    <ReferenceWorkbench region={region} plan={plan} disabled={busy || !!pending || !!restored.error} revision={event.revision} onChange={change} />
    <div className="section-heading"><div><h2>Street restrictions</h2><p className="muted">Use the named references or keep an uncertain location as text.</p></div></div>
    <div className="add-row"><label>Location<select value={roadId} onChange={e => setRoadId(e.target.value)}>{roads.map(road => <option key={road.id} value={road.id}>{road.label}</option>)}<option value="written">Written location · unmapped</option></select></label><button disabled={plan.entries.length >= 32 || busy || !!pending || !!restored.error} onClick={addRestriction}>Add restriction</button></div>
    {!plan.entries.length && <p className="empty-state">No restrictions are recorded. An empty plan does not confirm that roads are open.</p>}
    <ol className="restrictions">{plan.entries.map((entry, i) => <li key={entry.id}><RestrictionFields entry={entry} index={i} disabled={busy || !!pending || !!restored.error} onChange={patch => change(entry.id, patch)} onRemove={() => setPlan(value => ({ ...value, entries: value.entries.filter(e => e.id !== entry.id) }))} /></li>)}</ol>
    <label className="checkbox"><input type="checkbox" disabled={busy || !!pending || plan.entries.some(e => e.status !== 'cancelled')} checked={plan.noRoadClosuresConfirmed} onChange={e => setPlan(value => ({ ...value, noRoadClosuresConfirmed: e.target.checked }))} />I reviewed this event and confirmed it has no road or parking restrictions.</label>
    <label className="notes">Private planning notes<textarea rows={3} maxLength={2000} value={plan.notes} disabled={busy || !!pending} onChange={e => setPlan(value => ({ ...value, notes: e.target.value }))} /><span className="hint">Planning notes and access instructions are excluded from the public API.</span></label>
    <div className="save-bar"><button className="primary" disabled={busy || !!pending || !!restored.error || !dirty} onClick={() => void perform('save')}>{busy ? 'Working…' : 'Save draft'}</button><button disabled={busy || !!pending} onClick={async () => { try { setLatest(await read<EventRecord>(`${root}/events/${event.id}`)); setError('') } catch (e) { setError(message(e)) } }}>Compare latest saved version</button><span>{dirty ? 'Your draft is kept on this device.' : 'Draft matches the saved plan.'}</span></div>
    {latest && <section className="comparison"><h2>Saved revision {latest.revision}</h2><p>Your draft has {plan.entries.length} restrictions; the server has {latest.plan.entries.length}.</p><ul>{latest.plan.entries.map(e => <li key={e.id}>{e.label}: {e.startsAt} to {e.endsAt}</li>)}</ul><p>Keeping your draft against this revision can replace someone else’s changes on the next save. Review the differences first.</p><div className="actions"><button disabled={busy || !!pending} onClick={() => { setEvent(latest); onSaved(latest); setBaseRevision(latest.revision); setLatest(null); setNotice('Latest revision loaded as the comparison base. Your draft is unchanged.') }}>Keep my draft against revision {latest.revision}</button><button disabled={busy || !!pending} onClick={() => { adopt(latest); setNotice('Loaded the saved plan and discarded this device draft.') }}>Discard my draft and load saved plan</button></div></section>}
    <details className="publication"><summary>Review and publish a saved plan</summary><p>{event.publication ? `Published version ${event.publication.version} stays unchanged while you edit a draft.` : 'No version is published. Review the saved plan before enabling its public API.'}</p>
      {dirty && <p className="notice">Save your draft before reviewing it for publication.</p>}
      <ul>{event.plan.entries.filter(e => e.status !== 'cancelled').map(e => <li key={e.id}><strong>{e.label}</strong> · {statusNames[e.status]} · {e.startsAt} to {e.endsAt} ({region.timeZone})</li>)}</ul>
      <label className="checkbox"><input type="checkbox" checked={reviewed} disabled={dirty || busy || !!pending} onChange={e => setReviewed(e.target.checked)} />I checked the saved locations, time windows and status.</label>
      <div className="actions"><button className="primary" disabled={!reviewed || dirty || busy || !!pending || !event.plan.entries.some(e => e.status !== 'cancelled')} onClick={() => void perform('publish')}>Publish reviewed saved plan</button>
        {event.publication && <button disabled={busy || !!pending || dirty} onClick={() => void perform('withdraw')}>Withdraw publication</button>}
      </div><p className="hint">Publication sends no emails and makes no navigation-provider submissions.</p>
      {event.publication && <a className="download-link" href="/api/v1/public/sandbox/closures?format=geojson" target="_blank" rel="noreferrer">Open published workspace GeoJSON</a>}
    </details>
  </>
}
function RestrictionFields({ entry, index, disabled, onChange, onRemove }: { entry: Restriction; index: number; disabled: boolean; onChange: (patch: Partial<Restriction>) => void; onRemove: () => void }) {
  return <fieldset disabled={disabled}><legend>Restriction {index + 1} · {entry.geometry ? entry.geometry.type === 'Point' ? 'One location' : 'Street segment' : 'Written limits — unmapped'}</legend>
    <label>Location description<input value={entry.label} maxLength={160} onChange={e => onChange({ label: e.target.value })} /></label>
    <div className="form-grid"><label>Impact<select value={entry.impact} onChange={e => onChange({ impact: e.target.value as Restriction['impact'] })}>{Object.entries(impactNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>Status<select value={entry.status} onChange={e => onChange({ status: e.target.value as Restriction['status'] })}>{Object.entries(statusNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
      <label>Restrictions start<input type="datetime-local" value={entry.startsAt} onChange={e => onChange({ startsAt: e.target.value })} /></label><label>Restrictions end<input type="datetime-local" value={entry.endsAt} onChange={e => onChange({ endsAt: e.target.value })} /></label>
      <label>No parking from (optional)<input type="datetime-local" value={entry.parkingStartsAt} onChange={e => onChange({ parkingStartsAt: e.target.value })} /></label><label>Direction<select value={entry.direction} onChange={e => onChange({ direction: e.target.value as Restriction['direction'] })}><option value="both">Both directions</option><option value="from_to">Along the reference direction</option><option value="to_from">Against the reference direction</option></select></label>
    </div>
    <label>Public source URL (optional)<input type="url" maxLength={500} value={entry.sourceUrl} onChange={e => onChange({ sourceUrl: e.target.value })} /></label>
    <label>Public detour description (optional)<textarea rows={2} maxLength={400} value={entry.detour} onChange={e => onChange({ detour: e.target.value })} /></label>
    <label>Private access instructions (optional)<textarea rows={2} maxLength={800} value={entry.accessNotes} onChange={e => onChange({ accessNotes: e.target.value })} /></label>
    <button className="quiet" onClick={onRemove}>Remove restriction {index + 1} from draft</button>
  </fieldset>
}
function Sources({ sources }: { sources: Session['referenceSources'] }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  return <section className="page"><p className="context">Engineering reference catalog</p><h1>Connect to source data</h1><p className="intro">Inspect the City’s public layer schema before selecting data for a project. Metadata inspection is read-only; it does not import records or establish reuse rights.</p>
    <ul className="source-list">{sources.map(source => <li key={source.id}><div><h2>{source.name}</h2><a href={source.url} target="_blank" rel="noreferrer">View upstream ArcGIS layer</a><p className="hint">Provider: City of Fayetteville · Reuse rights unreviewed</p></div><button disabled={!!busy} onClick={async () => { setBusy(source.id); setError(''); setData(null); try { setData(await read(`/api/v1/reference-sources/${source.id}/metadata`)) } catch (e) { setError(message(e)) } finally { setBusy('') } }}>{busy === source.id ? 'Reading schema…' : 'Inspect metadata'}</button></li>)}</ul>
    {error && <p role="alert" className="error">{error}</p>}
    {data && <section className="metadata"><h2>Inspected metadata</h2><dl><dt>Layer</dt><dd>{String(data.name)}</dd><dt>Geometry</dt><dd>{String(data.geometryType)}</dd><dt>Native CRS identifier</dt><dd>{String(data.sourceCrs ?? 'Not advertised')}</dd><dt>Object ID field</dt><dd>{String(data.objectIdField ?? 'Not advertised')}</dd><dt>Pagination advertised</dt><dd>{data.supportsPagination ? 'Yes' : 'No'}</dd><dt>Retrieved</dt><dd>{String(data.retrievedAt)}</dd></dl><p className="notice">Native coordinates may use State Plane units. Do not read them as longitude/latitude. Inspection does not accept this layer into a plan.</p><details><summary>Inspect the sanitized schema JSON</summary><pre>{JSON.stringify(data, null, 2)}</pre></details></section>}
  </section>
}
function Developer() {
  return <section className="page"><p className="context">Engineering integrations</p><h1>Build on reviewed plans</h1><p className="intro">The local sandbox exposes published synthetic restrictions as JSON and GeoJSON, including stable feature IDs, local/UTC times and publication versions.</p>
    <h2>Try the public reader</h2><pre>{'curl "http://127.0.0.1:8788/api/v1/public/sandbox/closures?format=geojson"'}</pre><p>Save and explicitly publish a demonstration plan first. An empty response means there are no published restrictions for that query; it does not mean every street is open.</p><div className="actions"><a href="/api/v1/public/sandbox/closures?format=geojson" target="_blank" rel="noreferrer">Open GeoJSON</a><a href="/api/v1/openapi.json" target="_blank" rel="noreferrer">Open API discovery document</a></div>
    <h2>Implemented in this sandbox</h2><ul><li>Revision-guarded saves and idempotent operation receipts.</li><li>Published snapshots that remain unchanged during draft edits.</li><li>Explicit public fields; private planning and access notes stay out.</li><li>Two synthetic regions and read-only inspection of approved ArcGIS metadata.</li></ul>
    <h2>Next integration work</h2><p>Production identity and scoped machine access, full ArcGIS imports, bbox/cursor catalogs, business/parcel/entrance joins, GIS-client acceptance and signed change subscriptions remain in the implementation backlog.</p>
  </section>
}
