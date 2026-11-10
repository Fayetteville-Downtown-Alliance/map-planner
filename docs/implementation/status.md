# Implementation status

November 9, 2026. Work branch: `planning/standalone-migration`. Original code, synthetic records and reference geometry only. No hosted deployment or real-data migration.

## First vertical slice

- Implemented local workspace (issue #3): npm workspaces, locked dependencies, React/Vite frontend, Hono/Node API, SQLite local store and root validation commands.
- Implemented part of domain/time work (#4): input validation, two regions, DST-gap/fold rejection, Point/LineString/null, overnight/parking-day overlap and public field projection. Source-bound partial-road clipping is now implemented as recorded below; full DTA schema parity and network topology are not complete.
- Implemented part of events/version API (#6): durable event/plan history, atomic revision conflicts, operation receipts, separate publish/withdraw and explicit audit actor. The synthetic server-fixed workspace is not production tenancy/auth (#5).
- Implemented initial editor/recovery (#8): named synthetic roads/points and written locations, device drafts, conflict comparison, explicit saved-plan review and unknown-outcome receipt checks. Source-bound partial-limit editing is now implemented as recorded below; generic sketches do not establish verified boundaries.
- Implemented initial publication/public API (#10/#11): saved publication snapshot, draft/public separation, private-note exclusion, single-day JSON/GeoJSON and ETag/304. No public deployment, rich SEO or full engineering contract yet.
- Implemented first ArcGIS connector step (#21): allowlisted exact layer metadata, byte/time limit, redirect refusal, inert selected fields and error handling. Full discovery/import/pagination/schema migration remains open.
- Added GitHub quality workflow with unit/integration/client, build and built-client browser steps. No production deployment workflow exists. Remote execution/branch protection is not established by this file alone.

## Local evidence at the initial implementation commit

- Typecheck passed.
- 19 unit/integration/client tests passed in five files, including real SQLite/API-backed client interactions, restart persistence, stale saves, interrupted-response receipt recovery, private projection and metadata failures.
- Web/API build passed. MapLibre is dynamically loaded; the build warns about its roughly 1 MB minified map chunk. This remains a bundle/performance limitation, not a measured phone result.
- Built-client browser suite is authored; execution and any resulting fixes are follow-up validation in this work session.

## Remaining release limits

Use only on loopback with synthetic data. Real authentication/capabilities, service identities, external data rights, private source handling, GIS imports, real-data topology, business matching, exports, subscriptions, backup/restore operations and production acceptance are not complete. No physical iPhone/Android, software keyboard, assistive-technology or GIS desktop-client success is claimed.

See [ADR 001](adr-001-local-sandbox.md) for local-only decisions and [the roadmap](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/1) for the full requirement set. Closing the bootstrap issue must not be interpreted as closing these independent workstreams.

## Follow-up validation and recovery fixes

- Added runtime record-shape validation before accepting a write response. Malformed success responses preserve the pending command/draft until receipt reconciliation. Server 5xx responses also reconcile instead of assuming failure.
- Added MapLibre 6's explicit Vite-emitted worker URL and a positive map-ready case; the earlier failure-only coverage could not prove actual rendering. Browser tests use a fresh known event per case so persisted events cannot make locator counts/order nondeterministic.
- Added metadata inspection rate limiting, an API watcher for development, and a 404/no-store response for unknown hashed asset paths rather than a cached HTML fallback.
- Follow-up source checks passed 21 tests in five files; the built app passed nine browser cases across desktop Chromium, phone Chromium and phone WebKit, including 320px, reduced motion, deliberate renderer failure, actual bundled worker/map rendering and save/recover/publish/edit/withdraw against the real loopback SQLite API. Added explicit missing-asset HTTP assertions to the positive-render scenario.
- Reviewed generated desktop and 320px screenshots. Physical devices, soft keyboard, assistive technology and installed-client update scenarios remain unverified. A subsequent 200% text reflow check is recorded below.
- Production dependency audit reported zero vulnerabilities for the locked installed runtime dependencies. This does not establish a comprehensive security audit.

- The implemented metadata adapter also completed three live read-only checks against the exact approved City sources (street centerlines, address points and curb zones). Each returned its expected geometry type, EPSG:2264 and a sanitized field schema; rights remain unreviewed. No feature rows were imported.

## CI-driven native form reflow correction

The first GitHub run at `4fb9139` passed install/source/build and 8/9 browser cases, but Linux desktop Chromium detected horizontal overflow at 320px. A local 200% text reproduction exposed the same intrinsic-width problem: the single mobile `1fr` form track expanded to 540px. Changed that track to `minmax(0,1fr)`, allowed form controls/labels to shrink, wrapped long text and placed renderer failure copy in normal flow. No whole-page overflow hiding was added. The expanded nine-case local browser suite now passes normal and 200% text at 320px across its three browser projects. CI retains browser screenshots/traces/reports for future diagnosis; remote rerun evidence is tracked on the workflow and issues.

The next Linux run exposed one remaining 200% text case: the “Unsaved draft” badge retained nowrap and exceeded the viewport by four pixels with Linux font metrics. Allowed that badge to wrap within its container; retained the strict 320px assertions. Remote evidence distinguishes these two observed fixes from the earlier local-only passes.

Linux then passed the actual layout/render/workflow assertions; its remaining WebKit failure was the full-page screenshot exceeding the engine's 32,767 device-pixel dimension limit at 200% text and high DPR. Capture evidence at CSS-pixel scale while retaining the full page and unchanged assertions. This changes artifact sampling, not product behavior or coverage.

## Source-bound GIS slice (acceptance in progress)

Added source/dataset/version/feature-qualified partial limits, projected clipping with curve retention, API geometry/identity validation, and flat public GIS provenance. Old whole-reference drafts and independent/unmapped locations remain supported with explicit geometry status. The numeric limit preview/apply/cancel/undo uses the same save/publication flow. Comparison adapters implement Geoman Free endpoint dragging and OpenLayers Modify/Snap on a common contract; generic drawing and production editor selection are still open.

Added API-backed synthetic fixture generation, headless PyQGIS GeoPackage/GeoJSON roundtrip and an isolated rollback-only PostGIS substring/proximity CI job. Actual runtime and browser receipts will be appended after execution. Read [ADR 002](adr-002-source-bound-gis.md) for commands, tolerances, component boundaries and remaining acceptance.
