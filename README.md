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

Full City/OSM imports, clipping/partial-reference editing, genuine tenant authentication, scoped machine access, uploads, advanced exports, business/parcel joins, change subscriptions and production operations remain on the [GitHub roadmap](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/1).

See the [planning index](docs/planning/README.md), [local decisions](docs/implementation/adr-001-local-sandbox.md) and [implementation status](docs/implementation/status.md). DTA remains the operational system; no DTA secrets, contacts, database exports, source uploads or resource bindings are copied here.
