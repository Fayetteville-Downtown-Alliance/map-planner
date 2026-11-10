# ADR 002: Source-bound editing and engineering interchange

November 9, 2026. Status: accepted for the bounded local source-limit editor; broader production GIS acceptance remains open. Issue [#26](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/26) remains open for full editor and performance acceptance.

## Decision

The domain owns reference identity and geometry. A new mapped restriction records `sourceId`, `datasetVersion`, `featureId`, `measurementCRS`, `startFraction` and `endFraction`. Fractions increase along the stored reference direction and measure its projected two-dimensional length. A reversed source stays reversed; traffic direction is independent. Line clipping retains interior vertices. The API checks identity, version, region, limits and geometry together before committing a revision. Submitted geometry outside the canonical source-bound interval is rejected (coordinate comparison tolerance 1e-8 degrees); accepted geometry is replaced with the canonical result.

Existing whole-reference records retain their shape and must match the original reference when saved. Optional additive `reference` fields preserve earlier device drafts and publication snapshots. Legacy geometry is never silently reassigned to a changed source. Independent point/line geometry remains explicitly unverified; written limits retain null geometry. Synthetic source qualification does not establish official accuracy or source rights.

Map adapters only render the plan and return candidate handle coordinates. A gesture is projected onto the selected road only, with a 25 metre proximity guard and ordered limits. Numeric percentages provide the same action without dragging or WebGL. Apply, cancel and one-step undo operate on the device draft; save, revision conflicts, operation receipts, publication and private projection retain their existing API path.

## CRS and source version

The original straight fixtures retain IDs and coordinates. Additional synthetic curved/reversed fixtures exercise clipping in each region. East uses EPSG:2264 (US survey feet, 1200/3937 metres per unit); west uses EPSG:32610 (metres). GeoJSON stays WGS84 longitude/latitude. Proj4 is used without datum grids: this is an illustrative transformation, not a survey-grade coordinate service. Imported real data will require pinned transformations, accuracy/area-of-use review and explicit version migrations. Cross-check the implementation against independent PROJ-backed QGIS/PostGIS with a 0.02 metre numerical tolerance; that tolerance is a test comparison, not a datum accuracy claim.

## Browser comparison boundary

Three lazy adapters share identical synthetic references and a plan snapshot: current MapLibre viewer, MapLibre 6.17 + Geoman Free 0.10.8 endpoint dragging, and OpenLayers 10.11 Modify/Snap on the two limit points. Both editing adapters return coordinates through the same projection guard. Geoman's public Free package is the actual installed dependency; no paid demo is relied on. Generic freehand Draw/trace, native Geoman line snapping, multi-feature topology, and full undo history are not implemented or accepted by this slice. No arbitrary sketch implies a verified boundary.

OpenLayers is the default for this bounded source-limit editor: its Modify handles pass an actual desktop drag/cancel check and its emitted adapter is substantially smaller while rendering without WebGL. MapLibre remains an explicit viewer/comparison choice and Geoman remains an optional comparison path. This does not accept generic topology/drawing or production load requirements. The candidate bundles are isolated. Initial build observations: OpenLayers adapter about 324 kB minified / 91 kB gzip; MapLibre about 1,088 kB / 295 kB plus 520 kB worker, and Geoman adds about 685 kB / 193 kB. Shared application code is about 635 kB / 194 kB including projection support. These emitted-file sizes are not a network or phone-memory benchmark. Browser evidence records initial/fresh-context and reload readiness/resource bytes for the same workflow; caching state and engine are named. Ready callbacks differ by renderer (style/plugin load versus rendercomplete), so these are diagnostic observations, not a statistically comparable speed ranking. No production editor replacement is inferred from file size alone.

## QGIS and PostGIS

`npm run fixtures:gis` exports five restrictions through the real public API into generated `test-results/gis/` files: two partial curves (one reversed), two points (one unverified), and one unmapped written location. Public GeoJSON has stable event/restriction IDs, publication version and flat source/limit fields. It excludes private notes and access instructions. Mixed geometry is retained in the main export and split into typed layers for GIS drivers.

`/usr/bin/python3 scripts/gis/qgis-roundtrip.py test-results/gis` runs with QGIS Python bindings and `QT_QPA_PLATFORM=offscreen`. It verifies independent CRS control points, GeoJSON → GeoPackage → GeoJSON geometry/IDs/provenance/null preservation, and writes a portable QGIS project and report. This is headless tool acceptance; QGIS desktop UI, ArcGIS Pro, authenticated clients, edits reimported for review and actual business data remain issue #25/#22 work. Do not write directly into the planner database from QGIS.

The separate CI job installs Ubuntu distribution GIS tools on an ephemeral runner. An owned temporary PostgreSQL cluster uses a private Unix socket and no TCP listener. PostGIS proof SQL creates only temporary synthetic tables inside a rollback transaction. It compares projected `ST_LineSubstring`, converts feet/metres for `ST_DWithin`, checks an organization-scoped entrance candidate join, and records a tiny-fixture query plan/version. This does not provide RLS/auth, realistic index/load results, a production schema, business impact inference, or a backend migration. No hosted infrastructure is provisioned.

## References and adaptation

- [OpenLayers complete Draw/Modify/trace/Snap example](https://openlayers.org/en/latest/examples/draw-modify-trace-snap.html), inspected November 9, 2026: use the interaction/layer lifecycle and add Snap after Modify; omit remote tiles and freehand authority. Original application integration, no copied styling/framework.
- [Geoman source/package](https://github.com/geoman-io/maplibre-geoman): inspected installed 0.10.8 declarations, README and Free runtime. Use public import/export, global drag and cleanup APIs; no Pro capability assumptions.
- [QGIS vector cookbook](https://docs.qgis.org/3.44/en/docs/pyqgis_developer_cookbook/vector.html): vector writer, typed layer and provider patterns.
- [PostGIS substring](https://www.postgis.net/docs/ST_LineSubstring.html) and [proximity](https://www.postgis.net/docs/ST_DWithin.html): fractions follow projected 2D length and geometry distances use CRS units.
- [PROJ Lambert conformal conic](https://proj.org/en/stable/operations/projections/lcc.html): projection parameters; authoritative datum/grid selection remains separate work.

MapLibre BSD-3-Clause, OpenLayers BSD-2-Clause, Geoman Free MIT and Proj4 MIT remain component-specific licenses. QGIS is a separate GPL tool invoked in CI, not bundled into the web app. OSM is a possible licensed data adapter, not an editor replacement. QGIS Server/QWC2 remains optional only for full project/layout publishing needs.


## Verified receipt and remaining gates

At `9f42832`, [CI run 42729629198](https://github.com/Fayetteville-Downtown-Alliance/map-planner/actions/runs/42729629198) passed both jobs: 26 source tests and 18 browser cases, plus QGIS **3.34.4-Prizren**, PostgreSQL 16/PostGIS **3.4.2**, GEOS **3.12.1**, PROJ **9.4.0** (network grids off). The independent tool job preserved all five public restrictions, split across two lines/two points/one unmapped layer. The 0.02 metre projection/subcurve checks passed. PostGIS selected an index scan in this tiny synthetic query; this is no evidence of scale. A subsequent review found integer division in the demonstration radius expression; changed it to floating point and added inside/outside 25 metre boundary checks. Final CI must pass that correction before tagging.

The comparison's desktop drag/cancel tests observe rendered pixels and send real pointer events, without a test-only map API. Phone checks exercise numeric controls/rendering and emulate reduced motion; physical touch gestures, current QGIS desktop/LTR versions, ArcGIS Pro, keyboard/assistive technology and realistic workloads remain open. Older strict-schema web clients cannot consume the new reference fields: this sandbox release needs a page reload; production rollout still requires explicit reader-before-writer capability/version handling. Old device drafts remain readable by the new client.
