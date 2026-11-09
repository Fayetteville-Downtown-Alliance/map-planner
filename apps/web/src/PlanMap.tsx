import { useEffect, useRef, useState } from 'react'
import type { Map as LibreMap, GeoJSONSource } from 'maplibre-gl'
import { roadsFor, type Plan, type Region } from '@map-planner/domain'
import 'maplibre-gl/dist/maplibre-gl.css'

export function PlanMap({ region, plan }: { region: Region; plan: Plan }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<LibreMap | null>(null)
  const [failure, setFailure] = useState('')
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let disposed = false
    setFailure(''); setReady(false)
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (disposed || !container.current) return
      try {
        const instance = new Map({ container: container.current, center: region.center, zoom: 15,
          style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#edf3f5' } }] },
          attributionControl: false, cooperativeGestures: true, interactive: true })
        map.current = instance
        instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
        instance.on('load', () => {
          if (disposed) return
          const roads = roadsFor(region)
          instance.addSource('reference', { type: 'geojson', data: { type: 'FeatureCollection', features: roads.map(road => ({ type: 'Feature', geometry: road.geometry, properties: {} })) } })
          instance.addLayer({ id: 'reference-line', type: 'line', source: 'reference', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#9aaeb5', 'line-width': 6 } })
          instance.addSource('restrictions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          instance.addLayer({ id: 'restriction-line', type: 'line', source: 'restrictions', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#b83f27', 'line-width': 8, 'line-dasharray': [2, 1] } })
          instance.addLayer({ id: 'restriction-point', type: 'circle', source: 'restrictions', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#b83f27', 'circle-radius': 10, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } })
          setReady(true)
        })
        instance.on('error', () => { if (!disposed) setFailure('Map rendering is unavailable. The full restriction list and editor below remain usable.') })
      } catch { if (!disposed) setFailure('This browser cannot display the interactive map. Use the named road selector and written restrictions below.') }
    }).catch(() => { if (!disposed) setFailure('The map component could not load. Your written plan remains available below.') })
    return () => { disposed = true; map.current?.remove(); map.current = null }
  }, [region.id])
  useEffect(() => {
    if (!ready || !map.current) return
    const source = map.current.getSource('restrictions') as GeoJSONSource | undefined
    source?.setData({ type: 'FeatureCollection', features: plan.entries.filter(entry => entry.status !== 'cancelled' && entry.geometry).map(entry => ({ type: 'Feature', id: entry.id, geometry: entry.geometry!, properties: {} })) })
  }, [plan, ready])
  return <figure className="map-figure">
    <div ref={container} className="map-canvas" role="region" aria-label="Illustrative map of synthetic reference roads and draft restrictions" />
    {failure && <p role="status" className="map-fallback">{failure}</p>}
    <figcaption><span className="map-key" aria-hidden="true" /> Draft restrictions · Gray lines are fictitious reference streets. No City or OSM geometry is loaded.</figcaption>
  </figure>
}
