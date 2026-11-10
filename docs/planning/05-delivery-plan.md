# Delivery plan

The planning baseline is complete. This table records the original phase plan; the local bootstrap is now implemented and other phases are partial. See [current implementation coverage](../implementation/status.md) and GitHub issues for live status. Each phase must end with a reviewable commit, verification evidence and a work-log update. Tag accepted milestones with annotated tags; never move existing tags. This document sets dependencies, not a calendar promise.

| Phase | Work and deliverable | Depends on | Completion gate | Suggested commit/tag |
|---|---|---|---|---|
| M0 | Review, requirements, source manifest, decisions and safety boundaries | None | Link/hash validation; source/live evidence distinguished | `docs: ...`; `planning-baseline-2026-11-09` |
| M1 | Confirm source/data rights, pilot region/timezone and hosting/backend; create independent web/API/domain workspace, synthetic seed and isolated environments | M0 | Clean clone install/build/test; empty or synthetic DB; no DTA binding/network dependency | `chore: bootstrap standalone workspace`; `v0.1.0-alpha.1` |
| M2 | Port pure validators, topology/partial positions, public projection and fingerprints with source provenance | M1 | Existing behavior tests adapted; clipped Point/LineString/null and unknown source/reference cases pass | `feat: extract closure domain`; alpha milestone |
| M3 | Add scoped auth, organizations/events, versioned plans, atomic revisions, audit/receipts and private sources | M2 | Tenant/capability tests, real schema constraints, concurrent-save and recovery scenarios pass | `feat: add isolated planning API` |
| M4 | Adapt editor, manual source review, maps, phases, detours, exports and draft recovery; regional City/OSM adapter | M3 | Entire manual workflow and second-region fixture work without DTA services; mobile/keyboard checks pass | `feat: add standalone map editor`; `v0.1.0-alpha.2` |
| M5 | Separate review/publication, public day/range API, metadata, render jobs and withdrawal | M4 | Public projection/privacy, image fingerprint/withdrawal, stale snapshots and reader-before-writer compatibility pass | `feat: publish versioned closure plans`; `v0.1.0-beta.1` |
| M6 | Optional independent OCR/import jobs with budgets and accepted suggestions | M4; publication compatibility from M5 | Synthetic/authorized source corpus, failure/retry/cross-image lineage and human-acceptance gates pass | `feat: add reviewed map import` |
| M7 | Directory/parking adapters and optional explicit communications | M5 | Coverage caveats, recipient privacy, suppressions/idempotency and disabled-default delivery gates pass | Separate impact and delivery commits |
| M8 | Read-only DTA pilot import, shadow comparisons, operator acceptance and cutover rehearsal | M5; M6/M7 if enabled | Backup/restore, parity exceptions, live read verification, physical devices, rollback and owner acceptance | `chore: document pilot acceptance`; `v0.1.0` only after running-app acceptance |
| M9 | Multi-region scale rollout | M8 | Published load profile/benchmarks, cost/SLO, restore capacity and tenant fairness evidence | Version according to actual release scope |

## Safe copying procedure

1. Pin the source commit and check the working tree. Re-run the manifest check before importing; use Git objects for a historical revision rather than silently copying newer working files.
2. Review rights and classify each file as port/adapt/replace/exclude. Preserve permitted notices and third-party attribution. Target MIT does not by itself license upstream code/data.
3. Start with pure domain code and its sanitized tests. Resolve every local/package import explicitly; do not bulk-copy the DTA root, dependency lockfile, migrations or `wrangler.toml`.
4. Create new schemas/resources and a minimal dependency lockfile. No fallback to DTA credentials or URLs. Keep external adapters disabled and mail captured locally by default.
5. Port one vertical slice: synthetic event → reviewed road/point → save/conflict → preview → publication → public text/map/API → withdrawal.
6. For authorized real data, export only selected plans and allowed source references; transform IDs, tenant/region/timezone, source rights and visibility explicitly. Never import users, contacts or outbound queue rows as a side effect.

## DTA integration and eventual cutover

- Keep DTA authoritative through the shadow pilot. New app begins with no publishers or outbound jobs enabled against real data.
- Compare exported saved revisions, mapped vs unmapped limits, phase windows, status, detours, parking reviews, public redaction and image fingerprints. Preserve external IDs and checksums for idempotent re-import.
- Make a reviewed difference report. Link cycles between programs and calendars must be resolved before import. Reconcile post-export edits by source revision; do not overwrite newer target edits.
- Rehearse freeze/final delta, route/redirect mapping, per-event publication consent and consumer compatibility. DTA subscription links, public day links, QR codes and previously sent mail must remain valid or receive reviewed redirects.
- Cut over editing authority once, per organization/event. Never leave two editable masters or claim email notification equals navigation-provider acceptance.
- Roll back public routing/edit authority using recorded versions and stop new jobs. Restore data only with an explicit reconciliation plan so accepted target writes are retained. Run a restore drill before cutover.

## Commit discipline

Use small coherent commits: evidence → domain → API → UI → publication → integrations. Commit only this task's files; preserve unrelated changes. Record source/build identity, exact test scope and open issues. Planning tags describe documentation only, never production deployment. The baseline and local sandbox are pushed on the work branch. No hosted deployment or real-data migration has been performed.

## Engineering integration workstream

R29–R34 extend this plan: M3 defines scoped machine identities; M4 adds ArcGIS read-only discovery/import and source-qualified reference IDs; M5 adds engineering API/catalog/bbox/snapshot contracts; M7 adds business-location crosswalks, published-change subscriptions and GIS-client acceptance. See [the engineering/GIS plan](10-engineering-gis-integrations.md) and [linked work issues](09-github-backlog.md). No connector writes back to City GIS, and publicly visible edit capabilities do not authorize writes.


## Next GIS implementation slice (accepted November 9, 2026)

Execute issue #26 in reviewable steps, retaining the local sandbox and existing save/publication contract:

1. **Domain authority:** source/dataset/version/feature-qualified references; two ordered fractions along a curved or reversed reference; server-derived clipped geometry; reject unknown/stale/cross-region references and forged geometry. Preserve legacy whole-road drafts without silently reinterpreting their coordinates.
2. **Renderer comparison:** a shared map adapter contract, identical fixture/selection/limit callbacks, MapLibre + Geoman Free versus OpenLayers. Numeric limits, apply/cancel/undo remain usable without WebGL. No external basemap or data fetches.
3. **Engineering interchange:** flat, explicit public GeoJSON properties with stable IDs, source identity, publication version and geometry status. Generate synthetic fixtures and run PyQGIS GeoJSON → GeoPackage → GeoJSON with null/point/curve and EPSG:2264 unit/transform assertions. Desktop GUI acceptance remains separate.
4. **Spatial backend proof:** isolated, rollback-only PostGIS SQL covering source-bound substring, feet/metres, indexed entrance proximity and tenant scope. This is an evaluation, not an application database migration or public service.
5. **Evidence and decision:** compare emitted asset sizes and browser readiness on the same fixture; keep unmeasured memory/physical-device/large-scale performance open. CI must run browser and GIS checks. Select a production editor only when required interactions pass; a partial comparison cannot close #26.

Local Docker currently points to an unavailable daemon; QGIS is not installed. Add runnable scripts and a dedicated CI job to obtain actual tool evidence without changing shared services on this Mac. No production resources or real City feature imports are part of this slice.

## Hosted preview extension (authorized November 9, 2026)

The user now requests a Cloudflare Worker preview URL. [ADR 003](../implementation/adr-003-cloudflare-preview.md) adds a separate browser-isolated synthetic preview with its own Durable Object storage, limits and expiry. Keep original loopback development and production/PostGIS/data-rights decisions separate. Completion requires clean-source build identity, local Workers runtime/browser checks, `cf` dry-run, deployment to a new preview Worker, live health plus map/save/recovery/publication/isolation checks, and a committed receipt/tag. No existing DTA service is migrated or exposed.
