# Current feature review

## Scope and evidence

- Requested page: https://admin.faydta.com/awareness-calendar/closures.
- Source checkout: `~/Git/dta`, clean at review start, commit `66a0ebc2510d4ffb0db403fdee10d378ddc57d42`.
- Target: `~/Git/map-planner`, existing `main`, initially clean at `1ac99de`; remote is `https://github.com/Fayetteville-Downtown-Alliance/map-planner`. Existing `v0.0.1` is preserved.
- Browser host was unavailable. Web-reader access failed. Six unauthenticated HTTP GET probes returned 403: the requested page, admin calendar API, public dated JSON, two-day GeoJSON, parking inventory and OpenAPI. These responses do not establish whether the application, edge policy or review environment refused access. They do not verify the signed-in editor or public feed.
- No authenticated access, production database query, upload, save, publication, notification, email send or deployment was performed. Current deployed SHA and live records are unverified.
- This is a source-backed extraction review, not a completed runtime audit. Historical release evidence must not be reported as today's test results.

## Existing workflow (source)

`AwarenessClosuresPage.tsx` lists calendar notices by month, defaults to missing-details work, and opens individual planners on demand. Staff create an entry with dates plus affected-street text or a map URL. Creation makes it visible to members. Titles can be edited separately. Calendar cancellation is distinct from individual restriction cancellation.

The shared `OrganizerNotes` editor handles connected blocks/ranges, intersections, full loops, reviewed partial street limits and single road points. Written/unmapped restrictions remain usable. A locator identifies a place without asserting a closed boundary. Restrictions carry status, impact, direction, traffic windows, earlier parking windows, setup/access notes, detours and source evidence. Multiple phases remain distinct. Detours are open routes and are excluded from closure impact geometry.

Plans use schema version 1. Awareness saves compare `expected_closure_revision`; program saves compare `expected_details_revision`. Linked programs resolve the current program plan instead of making an independently editable copy; unlinking preserves the local plan. Public publication is a separate revision-guarded decision. Existing published plans can follow later saved edits; Map Planner must decide whether to retain this behavior or publish immutable snapshots.

Explicit “confirmed no road closures” differs from an empty/unreviewed plan and cannot coexist with active restrictions. It is not a public all-roads-open assertion.

Imports retain originals, inspect detail crops, independently read source facts and generate review proposals. Current shared prompt version is `city-closures-v14`, not the earlier v10 described in part of the long runbook. Guesses and map suggestions must be accepted deliberately; AI output is not City approval. Image import involves provider calls, not a harmless read-only inspection.

Business matching combines Guide places with DTA records using unique name and address; missing geocodes and partial directory coverage are visible. Geographic proximity establishes candidates, not blocked entrances. Parking reviews distinguish open, access changed, limited and closed, with required explanatory notes for changed/limited access.

Public day pages, JSON/GeoJSON, generated PNGs, text/PDF exports, previews and analytics are separate consumers. Public projection excludes private operational fields and source-upload storage keys. Generated images depend on a current fingerprint; stale image versions must be refused. Original uploads use authenticated readers.

## Findings that affect extraction

| ID | Finding | Consequence |
|---|---|---|
| F01 | Public-publish PATCH calls `notifyMappingProviders` after the publication write. The notifier inserts outbound messages and queues them. | Publishing is a communication side effect; never exercise it during review or shadow migration. Standalone publish and notify must be separate. |
| F02 | Older prose says publication sends no email; current handler contradicts it. | Handler is stronger evidence of current source behavior; live notification/delivery remains unverified. |
| F03 | Notifier has a fixed provider-recipient list and DTA sender/contact/URLs. Its helper formats `access_notes`, but the current outbound summaries do not consume that helper field. | Replace identity/recipient assumptions with reviewed tenant configuration; preserve a recipient-safe projection. No private-note delivery was established. Provider inbox validity/acceptance is unverified. |
| F04 | Notifier generates new message IDs per call; no event/revision/provider uniqueness guard was found in this function. | Re-publication/retries need a durable idempotent delivery ledger in the standalone design. Not a claim of observed duplicate delivery. |
| F05 | Street references are bundled Fayetteville City GIS data; business matching enforces Fayetteville bounds and a fixed Guide endpoint/500-place cap. | This is not yet a general OSM street planner. Region/reference and directory adapters are required. |
| F06 | MapLibre uses an OpenFreeMap basemap; road identities/closure topology come from City references. | Basemap selection does not migrate street IDs to OSM. Attribution and source-data rights require separate review. |
| F07 | Core schemas, UI, APIs, media and exports span admin/main/shared; DTA auth relies on shared domain cookies and host role clamps. | Copying a page alone cannot yield a standalone application. |
| F08 | DTA root has no tracked general LICENSE; target has MIT. | Record provenance and clarify reusable-code/data rights before importing source under the target license. This baseline copies requirements and hashes, not DTA application files. |
| F09 | Image rendering is prepared in browser publishing flows and refreshed after edits. | Reliable standalone publication needs recoverable rendering jobs and stale-image protection, independent of a staff tab staying open. |

## Evidence anchors

- `apps/admin/src/pages/AwarenessClosuresPage.tsx`: creation, editing, map generation, publication and program links.
- `apps/admin/src/components/OrganizerNotes.tsx`, `StreetExtentEditor.tsx`, `StreetClosureMap.tsx`: editor and geometry interaction.
- `apps/admin/functions/api/admin/awareness-calendar/[id].ts`: role guard, revisions, publication and notification call.
- `apps/admin/functions/lib/mapping-provider-notification.ts`: queued provider email behavior.
- `packages/shared/src/street-closures.ts`, `street-positions.ts`, `public-road-closures.ts`: validation/geometry/public projection.
- `apps/admin/functions/lib/closure-businesses.ts`: directory matching, hard-coded scope and coverage limitations.
- `docs/program-street-closures.md`, `docs/closure-image-import-audit.md`, `docs/closure-release-checklist.md`, `docs/road-closures-api.md`: history and operating contracts; inspect current code where they disagree.
