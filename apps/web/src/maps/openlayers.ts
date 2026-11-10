import Map from 'ol/Map.js'
import View from 'ol/View.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import Modify from 'ol/interaction/Modify.js'
import Snap from 'ol/interaction/Snap.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import Feature from 'ol/Feature.js'
import Point from 'ol/geom/Point.js'
import { fromLonLat, toLonLat } from 'ol/proj.js'
import { Circle, Fill, Stroke, Style } from 'ol/style.js'
import { roadsFor } from '@map-planner/domain'
import { restrictions, type MapAdapter, type MapOptions } from './contract'
import 'ol/ol.css'

export function createMap(options: MapOptions): MapAdapter {
  const format = new GeoJSON({ featureProjection: 'EPSG:3857' })
  const reference = new VectorSource({ features: format.readFeatures({ type: 'FeatureCollection', features: roadsFor(options.region).map(r => ({ type: 'Feature', id: r.id, geometry: r.geometry, properties: {} })) }) })
  const draft = new VectorSource(), handles = new VectorSource<Feature<Point>>()
  const red = new Style({ stroke: new Stroke({ color: '#b83f27', width: 8, lineDash: [12, 6] }), image: new Circle({ radius: 10, fill: new Fill({ color: '#b83f27' }), stroke: new Stroke({ color: '#fff', width: 3 }) }) })
  const map = new Map({ target: options.container, layers: [
    new VectorLayer({ source: reference, style: new Style({ stroke: new Stroke({ color: '#9aaeb5', width: 6 }) }) }),
    new VectorLayer({ source: draft, style: red }),
    new VectorLayer({ source: handles, style: new Style({ image: new Circle({ radius: 12, fill: new Fill({ color: '#153c41' }), stroke: new Stroke({ color: '#fff', width: 3 }) }) }) }),
  ], view: new View({ center: fromLonLat(options.region.center), zoom: 16 }), controls: [] })
  let canonicalHandles: import('./contract').Handles = null
  const modify = new Modify({ source: handles, pixelTolerance: 18, deleteCondition: () => false })
  map.addInteraction(modify)
  map.addInteraction(new Snap({ source: reference, pixelTolerance: 12 }))
  modify.on('modifyend', () => {
    const features = handles.getFeatures().sort((a, b) => String(a.getId()).localeCompare(String(b.getId())))
    if (features.length === 2) {
      const points = features.map(f => toLonLat(f.getGeometry()!.getCoordinates())) as [number[], number[]]
      // Restore canonical positions even when the consumer rejects the gesture.
      canonicalHandles?.forEach((p, i) => features[i].getGeometry()!.setCoordinates(fromLonLat(p)))
      options.onHandles(points)
    }
  })
  map.once('rendercomplete', options.onReady)
  let previous = ''
  return {
    update(snapshot) {
      canonicalHandles = snapshot.handles
      draft.clear(); draft.addFeatures(format.readFeatures(restrictions(snapshot.plan)))
      const next = JSON.stringify([snapshot.selectionId, snapshot.handles])
      if (next !== previous) {
        previous = next; handles.clear()
        snapshot.handles?.forEach((p, i) => { const f = new Feature(new Point(fromLonLat(p))); f.setId(String(i)); handles.addFeature(f) })
      }
      map.render()
    },
    dispose() { map.setTarget(undefined); map.dispose() },
  }
}
