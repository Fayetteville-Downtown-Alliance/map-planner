import type { FeatureCollection } from 'geojson'
import type { Plan, Region } from '@map-planner/domain'
export type Handles = [number[], number[]] | null
export type MapSnapshot = { plan: Plan; handles: Handles; selectionId: string }
export type MapAdapter = { update(snapshot: MapSnapshot): void; dispose(): void }
export type MapOptions = { container: HTMLElement; region: Region; onReady(): void; onFailure(): void; onHandles(points: NonNullable<Handles>): void }
export const restrictions = (plan: Plan): FeatureCollection => ({ type: 'FeatureCollection', features: plan.entries.filter(e => e.status !== 'cancelled' && e.geometry).map(e => ({ type: 'Feature', id: e.id, geometry: e.geometry!, properties: {} })) })
