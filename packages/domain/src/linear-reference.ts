import proj4 from 'proj4'
import type { Geometry, Region, Road } from './index'

// EPSG:2264 NAD83 / North Carolina (US survey feet). No datum grids: illustrative,
// not a survey-grade NAD83/WGS84 transformation. CI cross-checks against PROJ/QGIS.
proj4.defs('EPSG:2264', '+proj=lcc +lat_0=33.75 +lon_0=-79 +lat_1=36.1666666666667 +lat_2=34.3333333333333 +x_0=609601.22 +y_0=0 +datum=NAD83 +units=us-ft +no_defs')
proj4.defs('EPSG:32610', '+proj=utm +zone=10 +datum=WGS84 +units=m +no_defs')
export const measurementCRS = (region: Region) => region.id === 'demo-east' ? 'EPSG:2264' : 'EPSG:32610'
export const projectPosition = (point: number[], crs: string): [number, number] => proj4('EPSG:4326', crs, point) as [number, number]
export const unprojectPosition = (point: number[], crs: string): [number, number] => proj4(crs, 'EPSG:4326', point) as [number, number]
export const metresPerUnit = (crs: string) => crs === 'EPSG:2264' ? 1200 / 3937 : 1
export type ReferenceAnchor = { sourceId: string; datasetVersion: string; featureId: string; measurementCRS: 'EPSG:2264' | 'EPSG:32610'; startFraction: number; endFraction: number }
export function anchorFor(region: Region, road: Road, startFraction = 0, endFraction = 1): ReferenceAnchor {
  return { sourceId: `synthetic-${region.id}`, datasetVersion: region.referenceVersion, featureId: road.id, measurementCRS: measurementCRS(region), startFraction, endFraction }
}
function measured(road: Road, crs: string) {
  if (road.geometry.type !== 'LineString') throw new Error('Reference limits need a line.')
  const points = road.geometry.coordinates.map(p => projectPosition(p, crs))
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  if (!(total > 0)) throw new Error('Reference line has no measurable length.')
  return { points, lengths, total }
}
export function clippedGeometry(road: Road, anchor: ReferenceAnchor): NonNullable<Geometry> {
  const { startFraction: start, endFraction: end } = anchor
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > 1 || end - start < 0.000001) throw new Error('Reference limits must run from a lower fraction to a higher fraction within 0–1.')
  if (road.geometry.type === 'Point') {
    if (start !== 0 || end !== 1) throw new Error('Point references do not have partial limits.')
    return road.geometry
  }
  if (start === 0 && end === 1) return road.geometry
  const { points, lengths, total } = measured(road, anchor.measurementCRS)
  const at = (fraction: number): [number, number] => {
    let remaining = fraction * total
    for (let i = 0; i < lengths.length; i++) {
      const length = lengths[i]
      if (length > 0 && (remaining <= length || i === lengths.length - 1)) {
        const t = Math.max(0, Math.min(1, remaining / length))
        return unprojectPosition([points[i][0] + t * (points[i+1][0] - points[i][0]), points[i][1] + t * (points[i+1][1] - points[i][1])], anchor.measurementCRS)
      }
      remaining -= length
    }
    return unprojectPosition(points.at(-1)!, anchor.measurementCRS)
  }
  let walked = 0
  const interior = road.geometry.coordinates.filter((_, i) => {
    if (i) walked += lengths[i-1]
    return walked > start * total && walked < end * total
  })
  return { type: 'LineString', coordinates: [at(start), ...interior, at(end)] }
}
/** Project a gesture onto this selected reference only; never select a nearby street. */
export function fractionAt(road: Road, crs: string, point: number[]): { fraction: number; distanceMetres: number } {
  const { points, lengths, total } = measured(road, crs)
  const p = projectPosition(point, crs)
  let best = { fraction: 0, distanceMetres: Infinity }, walked = 0
  lengths.forEach((length, i) => {
    if (length > 0) {
      const a = points[i], b = points[i+1]
      const t = Math.max(0, Math.min(1, ((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1])) / (length*length)))
      const distanceMetres = Math.hypot(p[0]-a[0]-t*(b[0]-a[0]), p[1]-a[1]-t*(b[1]-a[1])) * metresPerUnit(crs)
      if (distanceMetres < best.distanceMetres) best = { fraction: (walked+t*length)/total, distanceMetres }
    }
    walked += length
  })
  return best
}
