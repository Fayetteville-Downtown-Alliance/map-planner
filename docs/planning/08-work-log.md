# Work log

## November 9, 2026 — planning baseline

### Completed

- Read DTA project guidance and traced admin editor, shared domain, API handlers, publication/email side effects, private media, map reference and public contracts.
- Recorded DTA source `66a0ebc2510d4ffb0db403fdee10d378ddc57d42`; working tree was clean before and after review/testing.
- Recorded target starting commit `1ac99de`, existing `v0.0.1`, MIT license and GitHub origin. Preserved all existing history/tags.
- Created current-state review and a 148-file source inventory with SHA-256 hashes. First commit: `5f1e938` (`docs: record DTA closures review and extraction inventory`).
- Created 28 prioritized requirements with acceptance criteria, proposed architecture/data/API boundaries, phased extraction/cutover plan, scale evaluation envelopes, verification checklist and risk/decision register.
- Refined F03 after inspecting the complete notification renderer: its helper builds access-note data but current outgoing summaries do not consume it. No private-note delivery is claimed.
- Added a read-only local link/source-manifest verifier. Planning baseline is documentation only; no application files/data were imported and no build/run/deploy scripts are promised.

### Verification

- `npm run test --workspace=@dta/shared -- src/street-closures.test.ts src/public-road-closures.test.ts src/closure-import.test.ts src/closure-parking-impact.test.ts`: **4 files, 46 tests passed**. This is a focused source suite, not DTA's full test/build/release gate and not Map Planner app acceptance.
- `python3 scripts/verify-planning.py`: source revision, 148 source hashes and local Markdown links checked before final commit.
- `git diff --check`: whitespace check before final commit.
- Requested admin page could not be visually reviewed: browser host unavailable; web reader inaccessible. Six HTTP GET attempts returned 403, including public endpoints. Cause and signed-in/live behavior remain unverified.
- No production state mutations, sends, imports, uploads, database queries, deployments or remote Git pushes.

### Commit/tag convention

Second commit: requirements, architecture, delivery plan, verification/decision records, this log and checker. Annotated tag `planning-baseline-2026-11-09` points to that final baseline commit. Resolve it with `git show planning-baseline-2026-11-09`; do not confuse it with an app release.

### Next work

M1: clarify reusable source/data rights, select backend/pilot parameters, bootstrap an isolated runnable workspace. Then port the domain and a synthetic vertical slice. Signed-in read-only walkthrough and live-source reconciliation remain open. No implementation milestone beyond M0 is complete.

## November 9, 2026 — published planning and implementation backlog

- User explicitly requested pushing the planning work/tag, creating feature/work issues on `Fayetteville-Downtown-Alliance/map-planner`, and making a branch.
- Pushed original commits `5f1e938` and `84b505b` to `origin/main`, plus annotated tag `planning-baseline-2026-11-09`; remote main and peeled tag both resolved to `84b505bcc002b0c19bdca6acd7899274fcb762dd` at verification.
- Created/pushed `planning/standalone-migration` and added this follow-up backlog documentation there; the original tag is unchanged.
- Created roadmap #1 and 19 work issues (#2–#20), with P0/P1/P2 labels, acceptance criteria, linked dependencies and full R01–R28 coverage. Existing issue list was empty before creation. No assignees or deadlines were invented.
- Updated the local planning index with the linked GitHub backlog and clarified the superseded no-push decision. No source application implementation, production mutation, email send, data migration or deployment was performed.
- Re-ran planning link/hash checks and whitespace validation. Final remote issue and branch checks verify the published state; this follow-up does not rerun the source tests or claim new application test coverage.

## November 9, 2026 — engineer-facing service and City ArcGIS research

- Investigated the supplied Fayetteville viewer base URL. Its missing app ID prevents identification of the exact configured viewer; anonymous portal metadata identified City organization `j3zNT485kmwrBtMJ`.
- Read public service/layer metadata for streets, address points, parcels, zoning, sidewalks and parking. Verified schema differences between DTA's hosted road source and City MapServer, plus a newer public parking map linking curb zones/spaces/facilities/devices.
- Anonymous bounded count queries in an explicitly recorded downtown test box returned 867 address points, 1,204 parcels and 77 curb zones. One allowlisted street GeoJSON query returned a LineString in WGS84. No feature records, parcel-owner data, contacts or credentials were retained in the repository.
- Identified a partial Wi-Fi business survey schema and a downtown land-use feature collection last modified in 2018; neither was accepted as an authoritative current business directory. Source rights, completeness, business identity/entrances and engineering accuracy remain unverified.
- Added source-linked research/metadata receipts and R29–R34: ArcGIS read-only adapter, reviewed business/location/parcel joins, developer API contracts, scoped machine identities, change subscriptions and GIS interoperability.
- Created issues #21–#25, updated roadmap #1 and related #7/#11/#14/#18, and extended the local backlog index. No issue/application implementation is claimed.
- Validated local document links, unchanged DTA source hashes, JSON evidence structure, requirement-to-issue coverage and whitespace. This is a documentation-only change; no app build/test, GIS-client visual acceptance or production import/deployment occurred.
- Commit/tag this extension on `planning/standalone-migration`; annotated tag `planning-engineering-2026-11-09` identifies the accepted planning source, not deployed software. Preserve the original baseline tag.
