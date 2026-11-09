# Implementation status

November 9, 2026. Work branch: `planning/standalone-migration`. Original code, synthetic records and reference geometry only. No hosted deployment or real-data migration.

## First vertical slice

- Implemented local workspace (issue #3): npm workspaces, locked dependencies, React/Vite frontend, Hono/Node API, SQLite local store and root validation commands.
- Implemented part of domain/time work (#4): input validation, two regions, DST-gap/fold rejection, Point/LineString/null, overnight/parking-day overlap and public field projection. Full DTA schema parity and partial-road topology are not implemented.
- Implemented part of events/version API (#6): durable event/plan history, atomic revision conflicts, operation receipts, separate publish/withdraw and explicit audit actor. The synthetic server-fixed workspace is not production tenancy/auth (#5).
- Implemented initial editor/recovery (#8): named synthetic roads/points and written locations, device drafts, conflict comparison, explicit saved-plan review and unknown-outcome receipt checks. No arbitrary geometry/partial-limit editing.
- Implemented initial publication/public API (#10/#11): saved publication snapshot, draft/public separation, private-note exclusion, single-day JSON/GeoJSON and ETag/304. No public deployment, rich SEO or full engineering contract yet.
- Implemented first ArcGIS connector step (#21): allowlisted exact layer metadata, byte/time limit, redirect refusal, inert selected fields and error handling. Full discovery/import/pagination/schema migration remains open.
- Added GitHub quality workflow with unit/integration/client, build and built-client browser steps. No production deployment workflow exists. Remote execution/branch protection is not established by this file alone.

## Local evidence at the initial implementation commit

- Typecheck passed.
- 19 unit/integration/client tests passed in five files, including real SQLite/API-backed client interactions, restart persistence, stale saves, interrupted-response receipt recovery, private projection and metadata failures.
- Web/API build passed. MapLibre is dynamically loaded; the build warns about its roughly 1 MB minified map chunk. This remains a bundle/performance limitation, not a measured phone result.
- Built-client browser suite is authored; execution and any resulting fixes are follow-up validation in this work session.

## Remaining release limits

Use only on loopback with synthetic data. Real authentication/capabilities, service identities, external data rights, private source handling, GIS imports, partial geometries, business matching, exports, subscriptions, backup/restore operations and production acceptance are not complete. No physical iPhone/Android, software keyboard, assistive-technology or GIS desktop-client success is claimed.

See [ADR 001](adr-001-local-sandbox.md) for local-only decisions and [the roadmap](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/1) for the full requirement set. Closing the bootstrap issue must not be interpreted as closing these independent workstreams.
