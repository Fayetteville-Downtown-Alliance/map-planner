# Product requirements

All unchecked items are implementation work. “Existing” means DTA source behavior to preserve, not implemented here. P0 gates the standalone pilot; P1 gates broader rollout; P2 is later expansion. Roles below are proposed tenant capabilities, not DTA global roles.

## Users and journeys

- Organization owner configures workspace, region, branding and staff; invitations never grant access to another organization.
- Planner creates an event, reviews sources, draws/selects restrictions and saves a draft.
- Reviewer checks road limits, dates, phases and evidence; publisher deliberately publishes the reviewed version.
- Resident/business reads a public day, mapped and unmapped restrictions, parking guidance and exports without an account.
- Directory coordinator reviews likely affected places without treating a proximity result as a blocked entrance.
- Integration consumer reads a documented snapshot API; operator diagnoses failed imports/renders without access to private source bodies in logs.

## Functional checklist and acceptance

| ID | Priority | Origin | Requirement and acceptance |
|---|---|---|---|
| R01 | P0 | New | Independent app: clean clone installs/builds with its own config, database, object store and synthetic fixtures; no import/runtime dependency on DTA checkout, cookies or services. |
| R02 | P0 | New | Organization isolation: every protected read/write, job, object and cache key derives tenant scope from authenticated membership; swapped tenant/event IDs cannot reveal data. |
| R03 | P0 | Adapt | Capability matrix: owner, planner, reviewer/publisher and viewer; API enforces capabilities independently of hidden buttons. Sensitive role changes are audited. |
| R04 | P0 | Existing | Event dates/title/status, missing-details queue, search/filter and cancellation; cancellation preserves history and removes public active restrictions. |
| R05 | P0 | Existing | Structured restrictions: full/lane/parking impacts, planned/confirmed/cancelled, direction, separate traffic/parking/setup windows and operational notes. Missing facts remain explicit. |
| R06 | P0 | Existing | Connected block/range, junction, loop, partial street and point editing; preserve clipped limits through reload/save, reversed/curved streets and two separate portions of one block. |
| R07 | P0 | Existing | Written-only boundaries and location-only pins stay visible but do not become closure lines or automated impact inputs. Never expand a driveway limit to a whole block. |
| R08 | P0 | Adapt | OSM-based regional planning: selectable regional road dataset with provenance/version, attribution, identity mapping and topology validation; demonstrate a second region with no Fayetteville code edits. City GIS remains a valid adapter. |
| R09 | P0 | Existing | Phase filtering and earlier/overnight no-parking windows; all-window maps disclose non-simultaneity; cancelled restrictions excluded from active maps. |
| R10 | P0 | Existing | Public detour text/routes are visually distinct open routes and never contribute to closed-road/business/parking matching. |
| R11 | P0 | Existing | Save conflicts: atomic expected-revision check; stale editor receives 409 and retains local work for comparison. Unknown write outcomes reconcile by operation receipt. |
| R12 | P0 | Adapt | Draft recovery: survives reload/background/update; protected drafts are tenant/user scoped and locked/cleared on identity changes. No automatic offline publication replay. |
| R13 | P0 | Existing | Manual source attachment and citation: private originals, validated file signatures/limits (including existing PDF map attachments), authenticated preview, recoverable upload errors. No arbitrary remote source fetching. |
| R14 | P1 | Existing | Optional AI import: independent OCR/source check, per-image phase lineage, original-pixel crops, provisional suggestions and explicit per-record acceptance. Source-check failure never creates a plan. |
| R15 | P0 | Adapt | Review/publication: publish an exact saved revision with a public field allowlist; withdrawal revokes public readers/images; a draft edit cannot silently replace the published snapshot. |
| R16 | P0 | Existing | Confirmed-no-restrictions is explicit and conflicts with active restrictions; unknown/empty is never described as confirmed open. |
| R17 | P0 | Existing | Public day/range views include every overlapping local day, source/status caveats and unmapped text; list remains useful after tile or JS enhancement failure. |
| R18 | P0 | Existing | PNG/PDF/text: same reviewed snapshot and numbered key; fit all applicable geometry, paginate notes, retain full text and identify event/date/timezone/status/source. |
| R19 | P0 | Adapt | Generated map: exact publication fingerprint/version, retryable render job, obsolete artifacts refused; original uploads never readable via a public catch-all. |
| R20 | P0 | Existing | Read API: JSON and GeoJSON Point/LineString/null, opaque stable IDs, explicit local time plus UTC instants, query validation and OpenAPI examples. Error never masquerades as empty success. |
| R21 | P1 | Existing | Business impact: unique identity crosswalk, bounded spatial matching and explicit missing/partial coverage; private contacts stay behind separate capability. |
| R22 | P1 | Existing | Parking candidates/reviews: unverified by default; open/access_changed/limited/closed, reviewer date, required notes, reviewed entrance vs representative point clearly distinguished. No inference of availability/prices. |
| R23 | P1 | Adapt | Program/calendar integration via scoped, versioned adapters; one editing authority, visible origin, no circular links or copied plan drift. |
| R24 | P1 | Adapt | Optional notifications: preview exact version/recipients first; separate explicit send, suppression checks, immutable recipient snapshot and idempotent delivery ledger. Disabled until configured and accepted. |
| R25 | P1 | Existing | Public sharing: visitor/crawler metadata parity, dated canonical, event-specific current image, no private draft indexing or stale map preview. |
| R26 | P0 | Adapt | Audit: durable actor/tenant/action/revision evidence for save/review/publish/withdraw/access changes; source bytes, private text and credentials absent from diagnostics. |
| R27 | P1 | Existing | Privacy-conscious aggregate analytics with closed vocabulary, retention and error visibility; no person-level tracking required. |
| R28 | P0 | New | Operations: own environments, schema migrations, backup/restore drill, rate/size/concurrency limits, job retries/dead letters, served-build verification and rollback. |

## Existing limits to preserve until deliberately revised

Version-1 plan validator: 32 restrictions/plan, 2,000 general-note characters, 800 access-note characters, 500 source-URL characters. Detours: 400 characters and 12 reference segments. Parking review notes: 300 characters. Image import: up to five PNG/JPEG/WebP images, 4 MiB combined; up to six detail views with a separate 4 MiB total; pasted source text up to 20,000 characters. Review actual server caps before extraction; do not silently inflate them for “scale.”

Existing DTA API supports at most 31 inclusive days per range, 60-second public caching and conditional ETags for closure snapshots. These are compatibility inputs, not a promised Map Planner quota or SLA.

## Accessibility and mobile acceptance

- Reflow at 320 CSS px and 200% text; keyboard path for every map action, including non-drag partial-limit editing.
- Visible action words/focus, accessible error/status announcements, 48px targets and 18px body for the current senior-facing audience; status uses words as well as color.
- Reduced motion retains all outcomes. Tile/WebGL failure keeps written data and current selections.
- Test Back/Forward, keyboard-open fields, upload interruptions, auth expiry, conflict recovery, suspend/resume and an old tab across a deployment.
- Physical iOS Safari and Android acceptance remain separate from emulation or desktop WebKit.

## Scope boundaries

Responsive web first. Arbitrary polygons, accessibility/traffic simulation, routing guarantees, live navigation-provider integration, native apps, payments, subscriber campaigns and generalized event registration are separate future scope. A basemap, GIS geometry or AI interpretation does not establish legal closure authority or City confirmation.
