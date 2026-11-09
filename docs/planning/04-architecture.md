# Proposed standalone architecture

This design is proposed; no infrastructure has been provisioned or benchmarked.

## Application boundary

Use the existing TypeScript/React/MapLibre approach as the extraction starting point, with a standalone workspace, explicit packages and a separate public reader. Avoid copying Turborepo, every DTA dependency or its identity system solely because the source uses them.

```text
apps/web             staff workspace + public readable day pages
apps/api             authenticated commands + public snapshot API
apps/jobs            import, map rendering and optional delivery workers
packages/domain      schemas, geometry, time, public projection, fingerprints
packages/map-ui      map/editor + accessible written controls
packages/reference-data  regional source adapters and versioned catalog
packages/contracts   versioned API schemas, OpenAPI and generated docs
```

`domain` is React/runtime independent. Only API/jobs have credentials. Provider URLs, identity, organization brand, regional bounds and catalog versions are configuration, not hard-coded Fayetteville assumptions. Local fixtures require no DTA network calls.

## Storage and tenancy

| Entity | Essential proposed fields/boundary |
|---|---|
| organizations / memberships | tenant ID, user ID, capabilities, status; server resolves membership |
| regions / reference_versions | timezone, bounds, source/license/attribution, imported_at, immutable dataset checksum |
| events | tenant, region, title, local dates, lifecycle, external origin reference |
| plans / plan_versions | tenant/event, revision, schema version, canonical content hash, immutable version content |
| restrictions | stable IDs within version, geometry/reference provenance, status/impact, windows and evidence pointers |
| sources | tenant, object ID/hash, type/size, access classification and retention |
| reviews / publications | exact plan version, reviewer/publisher, date; public snapshot and withdrawal state |
| parking_reviews / directory_links | scoped source identity, reviewed status/date; no private roster in public shape |
| jobs / operation_receipts | tenant, kind, input revision/hash, idempotency key, attempts, lease/status/output |
| deliveries | tenant, publication version, channel, recipient snapshot/hash, idempotency key, provider status |
| audit_events | tenant, actor, action, target and before/after version pointers |

Immutable publication snapshots deliberately improve on DTA's “public follows later saved edits” behavior. Staff review/publish a changed version; withdrawal stops future reads immediately. Previously downloaded public files cannot be recalled. No migration automatically republishes old content.

DTA's D1/Workers/R2 stack is a possible first implementation, using entirely new resources. Benchmark it against a PostgreSQL/PostGIS alternative before selecting production spatial storage. Favor indexed relational fields for tenant/date/state queries and versioned JSON for canonical plan snapshots; avoid a scan of every organization's JSON plan for a public date. If D1 is chosen, prove tenant scoping, batching, constraints and migration behavior in the actual runtime. If PostGIS is chosen, verify geometry/index query plans. Neither backend has been selected by this document.

## API boundary (proposed)

- Staff: scoped `/api/v1/organizations/:org/events`, `.../events/:event/plan`, `.../reviews`, `.../publications`, `.../sources`, `.../imports`, and operation/job receipt reads.
- Public: `/api/v1/public/:org/closures?date=...` or bounded range/GeoJSON; current generated-map and public reference inventory routes. Tenant slug resolves to a known public organization; it does not grant staff access.
- Revisions apply to metadata as well as geometry. Commands return operation receipt and resulting revision. Publish and notify are separate endpoints/capabilities. CSRF protection applies to cookie-authenticated writes; path-case normalization agrees with router behavior.
- Public snapshots are allowlisted data, not a redacted `SELECT *`. Authenticated APIs and original media use private/no-store caching. Public CORS excludes credentials. Cache keys include organization, region/reference version, query, publication version and representation.
- Persist IANA zone plus local wall clock and resolve UTC instants centrally. Reject or explicitly disambiguate nonexistent/ambiguous DST times. DTA's Eastern-only helpers need adaptation before another timezone.

## Maps, sources and OSM

Separate basemap rendering from operational road topology. Retain source reference IDs as opaque namespaced identities; never assume a City ID is an OSM way ID. Regional import validates connected roads, crossing/grade-separation handling, duplicates, geometry orientation and source coverage. Dataset upgrades require an explicit migration/crosswalk report; unmatched references remain reviewable text rather than snapping elsewhere.

Assess tile/geocoder usage policy, attribution, OSM/database licensing, aerial imagery rights, export rights, source freshness and cost separately. No public community tile/geocoder endpoint is assumed to provide unrestricted production capacity. Do not georeference a diagram by guessing polygon corners.

Sources upload to private tenant-scoped storage. AI consumes only the selected authorized sources, treats embedded instructions as untrusted data, keeps per-image lineage, and returns drafts. Bound bytes, tokens, concurrency, time and per-tenant budget; cancellation does not imply the provider request was never accepted. Manual planning works when providers fail.

## Scale and reliability gates

These are synthetic evaluation envelopes, not forecasts or measured capacity:

| Stage | Candidate load to test | Gate |
|---|---|---|
| Pilot | 1 organization, 1 region, 10 simultaneous editors, 100,000 retained restrictions | Query plans and memory stay bounded; no cross-tenant data or revision loss |
| Expansion | 50 organizations, 10 regions, 100 editors, 1 million retained restrictions, 100 public read requests/sec | Indexed region/date reads, tenant fairness, bounded queues and documented measured latency/cost |
| Larger rollout | 500 organizations, 100 regions, 1,000 editors, 10 million retained restrictions, 1,000 public reads/sec | Dedicated spatial/index and storage strategy justified by profiling; restore and regional recovery rehearsed |

Provisional pilot target: p95 public cached reads under 500 ms and ordinary saves under 1 s excluding network/provider/import work; zero unauthorized cross-tenant reads/writes. Measure from a specified test region and publish warm/cold/cache-hit conditions and failure rates. Choose availability/SLO, RPO/RTO, retention and budget with the operator before production; there is no current SLA.

Long work uses durable jobs and bounded leases/retries. Result installation checks the original plan/source revision, so late work cannot replace a newer result. Delivery requires an outbox/receipt ledger; ambiguous provider outcomes reconcile before retry. Observe job age/failures, stale renders, source-check failures, tenant throttles, public-feed errors and missing reference coverage.

## Engineering/GIS integration extension

[The engineering integration plan](10-engineering-gis-integrations.md) adds a source catalog, read-only ArcGIS MapServer/FeatureServer adapters, source-qualified identity crosswalks, many-to-many business-location/parcel/entrance links, and scoped integration identities. Extend the public API with bounded bbox/time queries and consistent paginated snapshots, plus a separate authorized draft API. Publish contracts and a synthetic developer sandbox. Change-feed/webhook and GIS-client interoperability requirements are R29–R34; they are proposed capabilities, not existing endpoints.

Add `reference_sources`, `reference_snapshots`, `external_feature_links`, `business_locations`, `location_parcel_links`, `entrances`, `integration_identities` and optional `publication_changes`/`webhook_subscriptions` to the model as their phases land. Preserve tenant scope and field-level public projections throughout.
