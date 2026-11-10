import { useEffect, useMemo, useState } from 'react'
import { anchorFor, clippedGeometry, fractionAt, roadsFor, type Plan, type Region, type Restriction } from '@map-planner/domain'
import { PlanMap, type Engine } from './PlanMap'
import type { Handles } from './maps/contract'

export function ReferenceWorkbench({ region, plan, disabled, revision, onChange }: { region: Region; plan: Plan; disabled: boolean; revision: number; onChange(id: string, patch: Partial<Restriction>): void }) {
  const [engine, setEngine] = useState<Engine>(() => { const value = new URLSearchParams(window.location.search).get('map'); return value === 'geoman' || value === 'maplibre' ? value : 'openlayers' }), [id, setId] = useState('')
  const [start, setStart] = useState('0'), [end, setEnd] = useState('100'), [error, setError] = useState('')
  const [undo, setUndo] = useState<{ id: string; patch: Partial<Restriction> } | null>(null)
  const roads = useMemo(() => roadsFor(region), [region.id])
  const entry = plan.entries.find(e => e.id === id)
  const road = roads.find(r => r.id === entry?.referenceId && r.geometry.type === 'LineString')
  const reset = () => { setStart(String((entry?.reference?.startFraction ?? 0)*100)); setEnd(String((entry?.reference?.endFraction ?? 1)*100)); setError('') }
  useEffect(reset, [id, entry?.reference, revision])
  useEffect(() => { setUndo(null) }, [revision])
  let preview: { reference: NonNullable<Restriction['reference']>; geometry: NonNullable<Restriction['geometry']> } | null = null
  if (road && entry && start.trim() && end.trim()) {
    try {
      const reference = anchorFor(region, road, Number(start)/100, Number(end)/100)
      preview = { reference, geometry: clippedGeometry(road, reference) }
    } catch { /* Keep incomplete numeric inputs available; Apply explains the constraint. */ }
  }
  const handles: Handles = !disabled && preview?.geometry.type === 'LineString' && engine !== 'maplibre' ? [preview.geometry.coordinates[0], preview.geometry.coordinates.at(-1)!] : null
  const displayPlan = preview ? { ...plan, entries: plan.entries.map(e => e.id === id ? { ...e, ...preview } : e) } : plan
  const onHandles = (points: NonNullable<Handles>) => {
    if (disabled || !road || !preview) return
    const limits = points.map(p => fractionAt(road, preview!.reference.measurementCRS, p))
    if (limits.some(l => l.distanceMetres > 25) || limits[0].fraction >= limits[1].fraction) {
      setError('Keep both limits within 25 metres of this selected road, with start before end. The gesture was not applied.'); return
    }
    setStart(String(Number((limits[0].fraction*100).toFixed(4)))); setEnd(String(Number((limits[1].fraction*100).toFixed(4)))); setError('')
  }
  return <>
    <div className="form-grid"><label>Map renderer<select value={engine} onChange={e => setEngine(e.target.value as Engine)}><option value="maplibre">MapLibre · current viewer</option><option value="geoman">MapLibre + Geoman Free · comparison</option><option value="openlayers">OpenLayers · reference limits</option></select></label>
      <label>Edit reference limits<select value={id} disabled={disabled} onChange={e => setId(e.target.value)}><option value="">View plan without editing limits</option>{plan.entries.filter(e => roads.some(r => r.id === e.referenceId && r.geometry.type === 'LineString')).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label></div>
    <PlanMap region={region} plan={displayPlan} engine={engine} handles={handles} selectionId={id} onHandles={onHandles} />
    {road && entry && <fieldset disabled={disabled} className="limit-editor"><legend>Partial limits · {entry.label}</legend>
      <p>Percentages follow the reference’s stored direction, including reversed roads. The curve is retained between both limits. Map changes are previews until you apply them.</p>
      <div className="form-grid"><label>Start along reference (%)<input type="number" min="0" max="100" step="any" value={start} onChange={e => setStart(e.target.value)} /></label><label>End along reference (%)<input type="number" min="0" max="100" step="any" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
      <p className="hint">{engine === 'maplibre' ? 'Use numeric limits here, or choose a comparison renderer to drag the two handles.' : 'Drag a limit near the selected road to project it onto that reference, or enter percentages above.'} Coordinates and transformations are illustrative, not survey grade.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><button onClick={() => { if (!preview) { setError('Enter start and end within 0–100%, with start before end.'); return } setUndo({ id: entry.id, patch: { reference: entry.reference, geometry: entry.geometry } }); onChange(entry.id, preview); setError('') }}>Apply limits to draft</button><button onClick={reset}>Cancel limit preview</button><button disabled={!undo} onClick={() => { if (undo) { onChange(undo.id, undo.patch); setUndo(null); setError('') } }}>Undo last applied limits</button></div>
    </fieldset>}
  </>
}
