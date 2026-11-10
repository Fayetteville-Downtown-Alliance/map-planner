# QGIS, OpenStreetMap and web GIS implementation choices

Research date: November 9, 2026. Primary upstream documentation, repository metadata/readmes, package manifests, licenses and complete editing examples were inspected. Recommendations below are engineering judgments for Map Planner, not runtime benchmark results. See [repository/package evidence](gis-stack-repository-evidence-2026-11-09.json).

## Recommended division of responsibilities

Use **QGIS Desktop as the engineering analysis/interchange companion**, **City ArcGIS plus reviewed OSM data as reference sources**, and **a custom web client/API for the closure review/publication workflow**. Keep the running MapLibre sandbox while evaluating its drawing layer; prioritize **PostgreSQL/PostGIS for the next spatial-storage evaluation**. Add QGIS Server/QWC2 only if publishing complete QGIS projects and layouts becomes a core requirement.

For the next bounded implementation spike, compare **MapLibre 6 + Geoman Free** against **OpenLayers 10 native Draw/Modify/Snap** on the same source-bound road-editing fixtures. Geoman's current free package explicitly targets MapLibre 6, which is already installed. Terra Draw is a credible portable alternative if we want one drawing API across rendering libraries. Do not change the existing client or add all three libraries before that comparison.

This keeps engineers' desktop tools useful, preserves a focused mobile workflow for staff/businesses, and makes the data/contracts available to other software. It avoids making a new QGIS server installation a prerequisite for basic event editing.

## The layers of the decision

| Layer | Role in this application | Candidate |
|---|---|---|
| Source data | Street identities, parcels, addresses, parking and contextual POIs; each with its own provenance/rights/freshness | City ArcGIS services; reviewed OSM extracts; independently managed business directory |
| Basemap delivery | Visual orientation and geographic labels | Configured tile provider or regional Protomaps/PMTiles, with attribution |
| Browser map/editor | Render selected references and edit reviewed limits | Current MapLibre with a drawing adapter; OpenLayers benchmark alternative |
| Spatial database | Indexed parcel/road/entrance relationships and validated geometry | PostGIS evaluation; SQLite remains the synthetic local bootstrap |
| Workflow/API | Tenant access, draft versions, evidence, review, publication, withdrawal, receipts | Map Planner's own API and domain packages |
| Engineering desktop | Quality control, joins, transformations, layout/export and GIS project authoring | QGIS Desktop; ArcGIS Pro interoperability test |
| Optional GIS publishing | Serve QGIS cartography/projects through standards and a broader GIS portal | QGIS Server + QWC2; Lizmap alternative |

[OpenStreetMap describes itself as community-maintained map data](https://www.openstreetmap.org/about). [QGIS distinguishes desktop editing/analysis from server publishing](https://www.qgis.org/project/overview/). They can be used together. Neither replaces a maintained business-occupancy/entrance record or our plan publication authority.

## Candidate assessment

| Candidate / source | Strength for this product | Integration cost or limitation | Recommendation |
|---|---|---|---|
| [QGIS Desktop + Server](https://github.com/qgis/QGIS) | Desktop joins, CRS work, quality checks and print layouts; server publishes QGIS project cartography and standard services | C++/Qt/Python server runtime and project/data/plugin operations; not a browser component or a Workers module. GPL component notices/redistribution need their own review. | Require desktop interoperability; evaluate server as a separate optional service. |
| [QWC2](https://github.com/qgis/qwc2), [QWC services](https://docs.qwc.app/master/) and [deployment repo](https://github.com/qwc-services/qwc-docker) | Existing React/OpenLayers web GIS with layer trees, measurements, external layers, print/export; services add editing, identity and multi-tenant facilities | Integrating our revision/receipt/review rules still requires work. Full services involve separate database, QGIS Server, gateway and several specialized services. | Best full-portal option when QGIS projects drive the product; run a separate proof before adopting as the core app. |
| [Lizmap](https://github.com/3liz/lizmap-web-client), [official docs](https://docs.lizmap.com/current/en/) | Publish QGIS projects through an established web portal, including attribute/spatial editing workflows | PHP/QGIS Server operating stack, plugin/project configuration and MPL-2.0 component; does not automatically implement our domain authority or pending-write recovery | Alternative QGIS-centric portal; lower priority than QWC2 for this React application. |
| [OpenLayers](https://github.com/openlayers/openlayers) | Native Draw/Modify/Snap interactions, vector formats and projection support; useful fit for engineering layers | More custom GIS UI still needed; editing interaction is not source topology, auth or publication. End-to-end behavior/performance remains unmeasured here. | Strongest browser alternative to test, particularly for projected CRS and feature editing. |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) + [Geoman](https://github.com/geoman-io/maplibre-geoman) | Keeps current vector-rendering client and adds geometry editing tools through a compatible current plugin | Free and paid editions differ; the demo showcases Pro. Verify each required operation in Free, and preserve the written/keyboard editing path. Generic snapping is not road-topology approval. | First drawing spike; retain MapLibre today, without prematurely adding a plugin. |
| [Terra Draw](https://github.com/JamesLMilner/terra-draw) | MIT drawing library with MapLibre/OpenLayers adapters; avoids tying all drawing logic to a renderer | Requires adapter/lifecycle/feature-ID synchronization and tested non-drag alternatives; no source-bound road or app workflow semantics | Portable alternative in the same spike, if cross-renderer reuse is valuable. |
| [qgis2web](https://github.com/qgis2web/qgis2web) | Export a QGIS project to static OpenLayers/Leaflet maps without server-side software | Useful export/reference viewer; generated static pages do not give us durable drafts, scoped API writes, reviews or live change subscriptions | Offer later as an interchange/reference path; avoid using a static export as the transactional application foundation. |
| [Protomaps/PMTiles](https://docs.protomaps.com/pmtiles/) | Regional read-only tile archives served with range requests, with MapLibre and OpenLayers integrations | Archives are rewritten to update; basemap licensing and delivery differ from transactional closure storage | Good future basemap/reference delivery option, separate from live plans. |
| [pg_featureserv](https://github.com/CrunchyData/pg_featureserv) / [pg_tileserv](https://github.com/CrunchyData/pg_tileserv) | Small PostGIS feature/tile read services and useful reference implementations | API-reported releases observed were from 2024; review maintenance/security before adopting. Broad DB privileges can expose unintended tables/views. | Evaluate behind a controlled published-view adapter; no default deployment. |

QWC2's BSD-2-Clause client and the MIT `qwc-docker` orchestration repo do not change the licenses of QGIS or other services. MapLibre's npm package and installed notice identify BSD-3-Clause; GitHub's root-file classifier returned NOASSERTION for the combined notices. PMTiles' selected JS package reports BSD-3-Clause; OSM-derived map data has its own license. Retain component/data notices and complete source-specific review rather than applying this repo's MIT license to all upstream material.

## What was checked beyond project names

- Inspected the complete [OpenLayers Draw/Modify/Snap example](https://openlayers.org/en/latest/examples/draw-and-modify-features.html) and [multiple-feature modification example](https://openlayers.org/en/latest/examples/modify-features.html), including interaction setup and cleanup. They demonstrate actual interactions, not the full application workflow. [Projection registration supports proj4](https://openlayers.org/en/latest/apidoc/module-ol_proj_proj4.html); accuracy and datum grids still require verification.
- Inspected QWC2's package manifest (React/OpenLayers/proj4), current services documentation, and the `docker-compose-example.yml` service/image inventory. It contains a QGIS Server 3.44 service and numerous independent backend services. This is a materially larger operating footprint than a browser map library, though optional services need not all be enabled.
- Inspected Geoman's README/current package constraints and React/Vite example links. Free version `0.10.8` advertises `maplibre-gl >=6.0.0 <7.0.0`. Its full demo is Pro; free feature coverage remains a test gate.
- Terra Draw MapLibre adapter `1.5.0` declares `maplibre-gl >=4`; OpenLayers adapter `1.3.0` declares `ol ^10.9.0`. Its README support table still names MapLibre v4/5, so package compatibility alone is not a runtime test of v6.
- Repository evidence shows recent October/November 2026 activity/releases for QWC2, OpenLayers, Terra Draw and Geoman. Stars and recent push timestamps are not support/security guarantees. GitHub's latest-release endpoint is not the authoritative stable/LTR installation channel; follow the [QGIS installation guidance](https://www.qgis.org/resources/installation-guide/) and match plugins/server/client versions.
- The investigation uncovered MapLibre 6 worker setup missing from our Vite bundle. Added a local emitted worker URL and a positive map-ready regression, instead of relying only on graceful map failure. This fixes the current renderer; it is not a comparison benchmark or adoption of Geoman/Terra Draw.

QGIS Desktop/Server, QWC2, Lizmap, PostGIS and alternative editors were not installed or deployed in this research. Their online demos were not interactively accepted. There is no QGIS/ArcGIS Pro import success, projection accuracy, survey-grade result or performance measurement to report yet.

## Data and business relationships

Use the separately [verified Fayetteville source inventory](../planning/10-engineering-gis-integrations.md). OSM adds broader road/POI coverage; municipal sources add local parcels/addresses/parking. Keep identities and geometry versions source-qualified. A basemap's depicted road must not silently replace a reviewed City segment or plan limit.

Store businesses, locations/suites, parcel links and reviewed entrances separately. PostGIS is a strong production candidate because it can index spatial joins and proximity queries; [ST_DWithin](https://postgis.net/docs/ST_DWithin.html) uses geometry CRS units, while geography distances use metres. Review coordinate/datum choices explicitly for North Carolina State Plane data. A numerical proximity result still needs a labelled candidate/review distinction.

QGIS should initially consume public snapshots or authorized, read-only project data. Returned desktop edits enter a staged draft import/API command with expected revision, idempotency and review. Direct database edits, WFS transactions or a generic portal editing service must not bypass Map Planner's audit/publication logic. If a GIS service is exposed, grant access only to approved per-tenant/project views with negative isolation tests; do not serve all reachable database tables.

OSM's [public tile service policy](https://operations.osmfoundation.org/policies/tiles/) describes limited capacity and no SLA, with attribution/cache requirements and no bulk prefetch. Use a provider or a deliberately hosted regional basemap for scale/offline plans. Do not interpret open data as unlimited hosted tiles or a current authoritative business directory.

## Bounded implementation comparison and decision gate

Use identical synthetic/authorized fixtures and the existing API contract for each contender:

1. Select a City-style road reference, choose two mid-block limits on a curved/reversed segment, and retain its source ID/version after save/reload. Include a point, written/unmapped boundary and two portions of one block. Generic freehand lines must remain distinguishable from reviewed source-bound restrictions.
2. Draw/edit/snap, undo/redo and cancel without mutating a published version; reject stale saves and recover an interrupted write via its receipt. Non-drag keyboard and numeric/landmark controls remain primary alternatives.
3. Display/transform a known EPSG:2264 fixture and compare a checked round trip in QGIS; record units, datum transformation, tolerances and any precision loss. Do not claim OSM/GeoJSON display proves survey accuracy.
4. Compare candidate business/parcel/entrance joins and explain unmatched/multiple suites; render private fields only with proper API authority.
5. Run 320/390px Chromium/WebKit, reduced motion, map/worker failures, 200% text and real-device keyboard follow-up. Measure initial transferred bytes, interactive latency, memory and large-layer performance under the same workload.
6. Open an exported snapshot in QGIS and ArcGIS Pro; verify stable IDs, time/status, null geometry, source attribution and withdrawal/resync semantics. Validate any optional QGIS Server/QWC2 deployment in isolation with synthetic data only.

Choose the simplest candidate that passes required editing, interoperability and recovery gates. Prefer OpenLayers for the editor if projected-layer editing and native interactions materially simplify those gates; prefer the existing MapLibre path if its compatible plugin passes with acceptable free-feature coverage and bundle behavior. Keep the public reader's rendering choice independent of the engineering desktop/server choice.

## Immediate application decisions

- Keep current MapLibre renderer and original synthetic references while preserving the working sandbox.
- Add a renderer/drawing adapter boundary before importing a drawing library; domain IDs, geometry versions, review and publication stay renderer independent.
- Make the comparison a tracked implementation issue linked to #7, #8, #21 and #25. It is not a reason to stall independent API/auth/domain work.
- Move PostGIS ahead of D1 in the spatial backend evaluation now that business/parcel/entrance joins and engineering GIS are explicit priorities. This is an evaluation order, not a provisioned backend or approval of hosting costs.
- Keep QGIS Desktop interoperability as a release acceptance requirement. A later QGIS Server/QWC2 project-publishing service is optional until an actual project/layout requirement justifies it.


## Implementation follow-up

The accepted next slice is implemented in [ADR 002](../implementation/adr-002-source-bound-gis.md): OpenLayers is the bounded source-limit editor default, MapLibre/Geoman Free remain comparison paths, source identity/limits are server checked, and QGIS/PostGIS have independent synthetic CI proofs. The initial research-only state and recommendation to retain MapLibre above are historical. No QGIS Server/QWC2 deployment, real feature import or production database migration has occurred. Desktop GIS and large-scale performance gates remain open.
