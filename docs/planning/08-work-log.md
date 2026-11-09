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
