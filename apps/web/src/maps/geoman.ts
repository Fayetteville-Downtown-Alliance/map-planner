import { Geoman } from '@geoman-io/maplibre-geoman-free'
import type { Map } from 'maplibre-gl'
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css'
export const createGeoman = (map: Map) => new Geoman(map, { settings: { useControlsUi: false } })
