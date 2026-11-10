import { useEffect, useRef, useState } from 'react'
import type { Plan, Region } from '@map-planner/domain'
import type { Handles, MapAdapter } from './maps/contract'
export type Engine = 'maplibre' | 'geoman' | 'openlayers'
export function PlanMap({ region, plan, engine = 'maplibre', handles = null, selectionId = '', onHandles = () => {} }: { region: Region; plan: Plan; engine?: Engine; handles?: Handles; selectionId?: string; onHandles?: (points: NonNullable<Handles>) => void }) {
  const container = useRef<HTMLDivElement>(null), adapter = useRef<MapAdapter | null>(null)
  const callback = useRef(onHandles); callback.current = onHandles
  const snapshot = useRef({ plan, handles, selectionId }); snapshot.current = { plan, handles, selectionId }
  const [failure, setFailure] = useState(''), [ready, setReady] = useState(false)
  useEffect(() => {
    let disposed = false
    setFailure(''); setReady(false)
    const fail = () => { if (!disposed) setFailure('Map rendering is unavailable. The full restriction list and numeric limits below remain usable.') }
    const timeout = window.setTimeout(fail, 20_000)
    const start = performance.now()
    const loaded = engine === 'openlayers' ? import('./maps/openlayers') : import('./maps/maplibre')
    void loaded.then(module => {
      if (disposed || !container.current) return
      try {
        adapter.current = module.createMap({ container: container.current, region,
          onReady: () => { if (!disposed) { window.clearTimeout(timeout); setReady(true); container.current?.setAttribute('data-ready-ms', String(Math.round(performance.now()-start))) } },
          onFailure: fail, onHandles: points => callback.current(points) }, engine === 'geoman')
        adapter.current.update(snapshot.current)
      } catch { fail() }
    }).catch(fail)
    return () => { disposed = true; window.clearTimeout(timeout); adapter.current?.dispose(); adapter.current = null }
  }, [region.id, engine])
  useEffect(() => { adapter.current?.update(snapshot.current) }, [plan, handles, selectionId])
  return <figure className="map-figure" data-map-engine={engine} data-map-state={failure ? 'failed' : ready ? 'ready' : 'loading'}>
    <div ref={container} className="map-canvas" role="region" aria-label="Illustrative map of synthetic reference roads and draft restrictions" tabIndex={0} />
    {failure && <p role="status" className="map-fallback">{failure}</p>}
    <figcaption><span className="map-key" aria-hidden="true" /> Draft restrictions · Gray lines are fictitious reference streets. No City or OSM geometry is loaded.</figcaption>
  </figure>
}
