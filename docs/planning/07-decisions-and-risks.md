# Decisions, risks and open questions

## Planning decisions

- D01: Deliver a documentation/extraction baseline first. Source applications, live data, credentials and infrastructure are not copied in this stage. Implementation work is sequenced in the delivery plan.
- D02: Build a standalone responsive web app with independent identity/storage/deployments. No DTA SSO cookie reuse or membership prerequisite.
- D03: Treat multi-organization and multi-region support as design requirements; pilot with one region. OSM basemap and operational road topology are distinct adapters.
- D04: Preserve existing schema/geometry semantics until a versioned migration is tested; keep uncertain/unmapped facts reviewable.
- D05: Separate publication, private source review, AI import and outbound notifications. Disable real delivery by default.
- D06: Proposed immutable published versions require explicit review/publish after draft edits. This is a deliberate behavior change from current DTA source.
- D07: The original baseline made local commits/tag only. Superseded for Git publication by the November 9 follow-up request: push the baseline/tag, create GitHub work issues and a working branch. DTA deployment and data cutover remain outside this work.

## Open decisions before their dependent phases

| ID | Decision | Default proposal | Needed before |
|---|---|---|---|
| Q01 | Pilot organization, second test region and audience | DTA/Fayetteville pilot; synthetic second region | M1/M4 |
| Q02 | Source-code rights and City/OSM/parking/imagery redistribution | Preserve notices; inventory each source separately | Any application/data copying |
| Q03 | Backend, hosting budget, auth provider and domain | Keep existing TS/map approach; benchmark storage choices | M1 provisioning |
| Q04 | Exact staff capabilities and review separation | Planner drafts; reviewer/publisher publishes; owner manages access | M3 |
| Q05 | Retention, privacy, residency, availability and RPO/RTO | Minimal protected data and bounded retention; no assumed SLA | M3/M8 |
| Q06 | Initial AI support/models/budget and source-sharing policy | Manual workflow first; optional provider adapter | M6 |
| Q07 | Directory ownership and approved adapters | Public directory separate from private contact/suppression adapter | M7 |
| Q08 | Notification channels/provider relationships and recipient verification | Explicit sends only after operator acceptance; no integration claim | M7 |
| Q09 | DTA import scope, continuing URLs/ICS and cutover date | Read-only shadow import, one authority per event | M8 |

These are recorded decision points, not claims of user approval or questions blocking documentation delivery.

## Risk register

| Risk | Priority | Evidence / mitigation | Owner |
|---|---|---|---|
| Accidental mail from public publication | High | Current handler queues provider mail; separate commands and dry-run transports | API/delivery implementer (unassigned) |
| Cross-tenant source/contact exposure | High | New isolation boundary; negative tests for routes, object keys, caches and jobs | Security/API implementer (unassigned) |
| Wrong road extent or false City confirmation | High | OCR/diagrams can mislead; preserve originals, independent checks, human acceptance | Product/reviewer (unassigned) |
| Wrong local/UTC/DST time across regions | High | Current helpers assume Eastern; explicit region zone and ambiguous-time tests | Domain implementer (unassigned) |
| Public asset remains after withdrawal | High | Fingerprint plus publication gate; private source store; download recall limits | Public-reader implementer (unassigned) |
| DTA license vs MIT target and third-party data | High | No general DTA root license found; resolve rights before copying code/data | Repository owner |
| Stale reference IDs snap to another road | High | Versioned catalogs/crosswalk and unresolved written fallback | GIS implementer (unassigned) |
| Underestimated scale | Medium | Fixed source bounds/500-place cap; pagination, indexes, candidate load tests | Operations implementer (unassigned) |
| Duplicate delivery / ambiguous provider outcome | High | No per-version uniqueness in inspected notifier; durable outbox and receipt reconciliation | Delivery implementer (unassigned) |
| Documentation/source/runtime drift | Medium | Live access blocked; pin source, reconcile deployed SHA; code outranks older prose | Migration owner (unassigned) |
| Lost unsaved work during updates/lifecycle | High | Recovery requirements, version checks and real mobile testing | Web implementer (unassigned) |

## Unverified runtime facts

Current deployed revision, provider inbox validity/delivery, production import success, actual public dataset coverage, geographic permissions, performance/cost envelope and physical-device usability all require fresh evidence. Existing dated DTA release receipts do not close these items for Map Planner.

## Engineering/GIS decision extension — November 9, 2026

- D08: Add R29–R34 for read-only ArcGIS adapters, business-location/parcel/entrance crosswalks, developer contracts, scoped machine access, optional change subscriptions and actual GIS-client acceptance.
- D09: Use source-qualified dataset/layer/version identities; City MapServer, hosted FeatureServer and OSM identifiers are not interchangeable. Resolve the authoritative/current parking layer before importing it.
- Q10: Identify the intended viewer app ID and any more complete/current business dataset. The supplied URL is a viewer base path; the discovered Wi-Fi survey is partial and downtown land-use collection is historical.
- Q11: Verify per-source rights, feature currency, address/parcel key semantics and coordinate transformations before production import or engineering accuracy claims.

Research and bounded query receipts are in [engineering/GIS integrations](10-engineering-gis-integrations.md). No active City business registry or verified business-entrance network was established.

## Implementation and GIS-stack follow-up — November 9, 2026

- D10: Proceed with original code and fictitious reference data in a loopback-only Node/SQLite sandbox; production authentication, hosting and external data rights remain unresolved. See [ADR 001](../implementation/adr-001-local-sandbox.md). Q02 does not block writing new code; it still gates copying upstream DTA/application/data material.
- D11: Treat QGIS as desktop engineering interoperability/analysis, OSM/City GIS as reference sources and the browser editor as its own component. Keep current MapLibre while issue #26 compares compatible drawing tools with OpenLayers. Optional QGIS Server/QWC2 is a distinct service decision.
- D12: Prioritize PostGIS over D1 in the production spatial-backend evaluation because parcel/business/entrance joins and engineering data are now explicit requirements. No production backend, budget or infrastructure is approved/provisioned by that evaluation order.

- D13: Select OpenLayers for the bounded local source-limit editor after actual desktop Modify gesture/cancel and equivalent numeric/save/publish flows; keep MapLibre/Geoman comparison paths. Source references and geometry remain domain/API authority. QGIS 3.34.4 and PostGIS 3.4.2 synthetic CI proofs passed; production/client/load acceptance remains separate. See [ADR 002](../implementation/adr-002-source-bound-gis.md).
