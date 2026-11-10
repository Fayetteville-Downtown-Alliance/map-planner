# Map Planner

Standalone street-closure planning and engineering GIS integration. An original, runnable **local synthetic sandbox** is implemented; production auth, real GIS imports and deployment are not yet available.

## Run locally

Requires Node 24–26 and npm. No credentials or external services are needed.

```sh
npm ci --ignore-scripts
npm run dev
```

Open **http://127.0.0.1:5178**. The local API runs at **http://127.0.0.1:8788**; `npm run dev` starts/stops both processes. Records persist in the ignored `.data/planner.sqlite`. `MAP_PLANNER_DB` can select another new local database. Do not point it at a DTA/other application database. `.env.example` documents variable names; the app does not automatically source credential files.

1. Open the synthetic event or create one in either demonstration region.
2. Add an illustrative road/point or written restriction, review hours and save the draft.
3. Expand **Review and publish a saved plan**, check the review box, then publish.
4. Open the published workspace GeoJSON. Later draft changes preserve the published snapshot; withdrawal removes it from subsequent public reads.
5. **Data sources** inspects public City ArcGIS schema only on request. No feature records are imported, and reuse rights remain unreviewed.

The server binds loopback, requires explicit sandbox mode and refuses production mode. There is no production sign-in or authorization provider; do not expose it through a tunnel/public proxy or store real private data. No notifications, AI calls or source uploads are implemented.

## Validate and run the built app

```sh
npm run check
# Install test browsers once if needed, then exercise the real local API and built client:
npx playwright install chromium webkit
npm run test:browser
# Optional manual built-app preview (loopback only):
npm run preview:sandbox
```

`npm run check` runs type checks, the unit/integration/client suite and web/API builds. Browser tests use their own synthetic database and block non-loopback network requests. Emulation/desktop WebKit does not establish physical-device acceptance. Use `npm run check:planning` for planning links/source hashes when the pinned DTA checkout is available.

## Implemented foundations

- Two synthetic regional timezones, validated local/UTC windows and Point/LineString/unmapped restrictions.
- SQLite persistence, transactional expected-revision saves, audit/version history and idempotent operation receipts.
- Device draft recovery, conflict comparison and explicit reviewed publication/withdrawal with public-field projection.
- JSON/GeoJSON snapshot API, ETags, and a limited API discovery document.
- Read-only bounded metadata inspection of three allowlisted ArcGIS layers.

Full City/OSM imports, network topology, genuine tenant authentication, scoped machine access, uploads, advanced exports, business/parcel joins, change subscriptions and production operations remain on the [GitHub roadmap](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/1).

GIS implementation research: [QGIS, OSM and current web GIS options](docs/research/2026-11-09-qgis-web-gis-options.md).

See the [planning index](docs/planning/README.md), [local decisions](docs/implementation/adr-001-local-sandbox.md) and [implementation status](docs/implementation/status.md). DTA remains the operational system; no DTA secrets, contacts, database exports, source uploads or resource bindings are copied here.

GIS work now includes source-bound partial-road limits and a renderer selector with OpenLayers as the local reference-limit editor and MapLibre/Geoman Free as comparison options. Use a curved/reversed synthetic location, add a restriction, select it under **Edit reference limits**, preview percentages and apply them to the draft before saving. Map gestures never save or publish automatically.

For engineers, `npm run fixtures:gis` generates typed synthetic public GeoJSON in `test-results/gis/`. The dedicated CI GIS job checks PyQGIS/GeoPackage interchange and isolated PostGIS spatial queries. See [the GIS contract and runnable checks](docs/implementation/adr-002-source-bound-gis.md). No real data or production GIS service is enabled.

## Cloudflare Worker preview

A separate browser-isolated synthetic Worker preview is implemented. Each browser gets its own workspace, with seven-day expiry; preview publications are visible within that workspace. This does not enable production sign-in, real data or public organizational publishing.

`npm run build:worker` creates Cloudflare Build Output; `npm run test:worker` exercises the real local Workers runtime over HTTPS. Deploy with the project-pinned `npx cf` and a newly generated preview signing secret. See [preview architecture, deployment and verification](docs/implementation/adr-003-cloudflare-preview.md). The deployment receipt will record the live URL and exact revision after verification.
