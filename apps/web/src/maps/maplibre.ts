import { Map, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import { roadsFor } from '@map-planner/domain'
import { restrictions, type MapAdapter, type MapOptions, type MapSnapshot } from './contract'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Geoman } from '@geoman-io/maplibre-geoman-free'

export function createMap(options: MapOptions, editing = false): MapAdapter {
  setWorkerUrl(workerUrl)
  const map = new Map({ container: options.container, center: options.region.center, zoom: 15,
    style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#edf3f5' } }] },
    attributionControl: false, cooperativeGestures: true })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  let disposed = false, loaded = false, geoman: Geoman | undefined, snapshot: MapSnapshot | undefined, previous = '', queue = Promise.resolve()
  const update = () => {
    if (!loaded || disposed || !snapshot) return
    ;(map.getSource('restrictions') as GeoJSONSource).setData(restrictions(snapshot.plan))
    const next = JSON.stringify([snapshot.selectionId, snapshot.handles])
    if (geoman && next !== previous) {
      previous = next
      const handles = snapshot.handles
      const instance = geoman
      queue = queue.then(async () => {
        if (disposed) return
        await instance.disableGlobalDragMode()
        await instance.features.deleteAll()
        if (handles && !disposed) {
          await instance.features.importGeoJson({ type: 'FeatureCollection', features: handles.map((p, i) => ({ type: 'Feature', id: `limit-${i}`, geometry: { type: 'Point', coordinates: p }, properties: { limitIndex: i } })) })
          if (!disposed) await instance.enableGlobalDragMode()
        }
      }).catch(() => { if (!disposed) options.onFailure() })
    }
  }
  map.on('load', () => {
    if (disposed) return
    map.addSource('reference', { type: 'geojson', data: { type: 'FeatureCollection', features: roadsFor(options.region).map(r => ({ type: 'Feature', id: r.id, geometry: r.geometry, properties: {} })) } })
    map.addLayer({ id: 'reference-line', type: 'line', source: 'reference', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#9aaeb5', 'line-width': 6 } })
    map.addSource('restrictions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({ id: 'restriction-line', type: 'line', source: 'restrictions', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#b83f27', 'line-width': 8, 'line-dasharray': [2, 1] } })
    map.addLayer({ id: 'restriction-point', type: 'circle', source: 'restrictions', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#b83f27', 'circle-radius': 10, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } })
    loaded = true; update()
    if (!editing) { options.onReady(); return }
    void import('./geoman').then(async ({ createGeoman }) => {
      if (disposed) return
      const instance = createGeoman(map); geoman = instance
      await instance.waitForGeomanLoaded()
      if (disposed) return
      instance.setGlobalEventsListener(event => {
        if (event.name !== 'gm:dragend') return
        const points = instance.features.exportGeoJson().features.filter(f => f.geometry.type === 'Point').sort((a, b) => Number(a.properties?.limitIndex) - Number(b.properties?.limitIndex))
        if (points.length === 2 && points.every(f => f.geometry.type === 'Point')) {
          previous = ''
          options.onHandles(points.map(f => (f.geometry as GeoJSON.Point).coordinates) as [number[], number[]])
          update() // Restore the last canonical snapshot if the consumer rejects a gesture.
        }
      })
      update(); await queue
      if (!disposed) options.onReady()
    }).catch(() => { if (!disposed) options.onFailure() })
  })
  map.on('error', () => { if (!disposed) options.onFailure() })
  return { update(value) { snapshot = value; update() }, dispose() { disposed = true; if (geoman) void geoman.destroy({ removeSources: false }).catch(() => {}); map.remove() } }
}
