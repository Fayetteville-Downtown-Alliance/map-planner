# Verification and release checklist

Unchecked items are future app acceptance, not current successes.

## Planning artifacts

- [x] Source/target state recorded; source paths and hashes pinned.
- [x] Current source behavior separated from historical runbook claims and proposed design.
- [x] Production save/publish/send/upload paths avoided.
- [ ] Complete signed-in, read-only browser walkthrough when browser access works; inspect filters, one saved plan, original-source preview and export preview without invoking provider calls.
- [ ] Verify deployed source identity and reconcile any source/live difference before code extraction.

## Domain and contracts

- [ ] Execute migrations against a real supported database; validate CHECKs, FKs, uniqueness and rollback/restore behavior.
- [ ] Range topology, partial limits, reversed/curved roads, loop/junction/point, unmapped locations and two parts of a block.
- [ ] Traffic vs parking/setup windows, overnight and DST cases, exclusive ending semantics, cancellation and explicit no-restrictions.
- [ ] Invalid IDs/URLs/geometry/sizes, bounded queries, stable opaque IDs, per-region reference upgrade crosswalk.
- [ ] Run adapted DTA regressions and independent fixtures whose correct/incorrect outcomes differ; passing copied tests alone is insufficient.

## Security and side effects

- [ ] Tenant A cannot read/mutate Tenant B events, sources, jobs, exports, receipts or caches; role/capability downgrade takes effect.
- [ ] Cookie/CSRF/session expiry, route-case consistency, unauthorized public switch and media-reader checks.
- [ ] Public APIs/crawler/PNG/exports omit private notes, contacts, email message IDs, source objects and secrets. Date/approved quotation-only confirmation citations follow an explicit contract.
- [ ] Save, import, preview and publication do not dispatch notifications. Only explicit send creates delivery jobs; replay cannot duplicate an accepted send.
- [ ] Timeout after accepted write/provider request produces an unknown state and receipt lookup, not blind replay.
- [ ] Logs/audits avoid private text, image bytes, tokens and credentials. Rate/byte/token ceilings and tenant fairness fail visibly.

## Public reader and generated artifacts

- [ ] Visitor/crawler titles, canonical, descriptions/status and actual image bytes/dimensions agree.
- [ ] Current image GET/HEAD policy and obsolete image versions checked; withdraw/private rejects public access. Original media catch-all refuses reads.
- [ ] JSON/GeoJSON and OpenAPI agree; GET/HEAD/OPTIONS, CORS errors, invalid query 400 and ETag/304 semantics checked.
- [ ] 200 replaces a query snapshot; 304 reuses it; failure retains a labelled stale snapshot. Empty data never claims all roads open.
- [ ] Tile/aerial/WebGL/provider failure preserves written data and selections; exports retain complete map/key/notes without clipping or missing pages.

## Browser/device and recovery matrix

| Surface | Coverage required | Current review |
|---|---|---|
| Editor/list/public page | Chromium 320/390/430/768/1280px; real content/error/empty states | Not run: browser host unavailable |
| Keyboard/screen reader/reduced motion | Full non-drag operation, focus/error announcements, 200% text | Not run |
| iOS Safari physical device | File picker, soft keyboard, map gestures, suspend/resume, download/print | Not run |
| Android physical device | Uploads, gestures, keyboard, lifecycle and export behavior | Not run |
| Old tab/new build | Draft preservation, stale chunk recovery, schema compatibility | Not run |

## Release and operations

- [ ] Clean exact source revision; canonical CI has required unit/contract/security/browser jobs in the deployment dependency chain. Advisory/skipped jobs cannot count as gates.
- [ ] New isolated resources only, backup/restore rehearsal, expand→migrate→contract, public readers before changed writers.
- [ ] Synthetic load meets selected envelope; measure p50/p95/p99, error rate, cold/cache hits, database query plans, queue lag and cost.
- [ ] Approved RPO/RTO, retention and incident owner; alarms and dead-letter replay demonstrated without sending real mail.
- [ ] Post-deploy source/build identity and asset content types checked, followed by authenticated synthetic workflow and public read tests.
- [ ] Acceptance log records actual devices, test counts, resource/environment identity and remaining limits; annotated tag matches accepted source.

## Commands available now

`python3 scripts/verify-planning.py` checks local Markdown links, pinned manifest hashes and source revision when the DTA checkout exists. It makes no network requests or production changes. There are no app build/run/deploy commands in Map Planner yet.

## Engineering/GIS acceptance extension

- [ ] MapServer and FeatureServer contract fixtures cover metadata, CRS, pagination/transfer limits, short/empty pages with more results, JSON errors on HTTP 200, schema drift, deletion and source failure.
- [ ] Allowlisted source/redirects reject SSRF and never forward service credentials; field allowlists exclude private/irrelevant parcel-owner and tax fields.
- [ ] Business/location/parcel/entrance joins preserve ambiguous suites, relocations and many-to-many relationships; source IDs survive crosswalk/republication review.
- [ ] Bbox/time/cursor queries remain within one declared snapshot; revocable machine credentials cannot publish/notify or access another tenant/project.
- [ ] TypeScript/Python/curl examples run against a synthetic sandbox; GIS client checks record QGIS/ArcGIS Pro versions, CRS and transformation/precision limits.
- [ ] Change cursor expiry, withdrawal, resync and signed webhook retry/deduplication tests pass before subscriptions are enabled.
