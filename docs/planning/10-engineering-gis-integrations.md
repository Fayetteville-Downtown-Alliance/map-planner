# Engineering integrations and Fayetteville GIS research

Research date: November 9, 2026. This extends the standalone plan; connectors, APIs and SDKs described below are proposed, not implemented. Direct anonymous REST metadata and bounded query checks succeeded. No upstream edits, record imports, private business/contact exports or deployments occurred.

## Product intent: a service engineers can build on

A civil/transportation engineer should be able to bring reference layers into a project, place a draft restriction against a known road, compare nearby parcels/business locations/parking, and consume the reviewed result in ArcGIS Pro, QGIS or another application. A software engineer should have a versioned contract, scoped machine access, reproducible examples, stable identities, change history and explicit error/freshness semantics.

Concrete first workflow: select a reviewed road segment → obtain nearby address/parcel candidates → match separately maintained storefronts → review entrances/impacts → publish a specific plan revision → query that public revision as GeoJSON or load it in a GIS client. No proximity result establishes that a driveway is blocked, an occupant is a parcel owner, or a route is legally approved.

## What the supplied URL establishes

The supplied `https://faync.maps.arcgis.com/apps/webappviewer` lacks a specific app/item identifier, so it does not identify which configured viewer the user intended. The anonymous [portal metadata](https://faync.maps.arcgis.com/sharing/rest/portals/self?f=pjson) identifies **City of Fayetteville**, organization `j3zNT485kmwrBtMJ`. Discovery followed the City's [public REST directory](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services) and [open-data portal](https://data.fayettevillenc.gov/), not an assumed app configuration. Full viewer inspection remains unperformed.

The portal warns that data accuracy, completeness, currency and continuing access are not guaranteed. Store retrieval/version metadata, monitor service drift and review per-item terms; public accessibility is not a blanket redistribution license. Empty item license metadata is unresolved, not permission.

## Verified candidate reference sources

| Source and exact layer | Observed schema/use | Limits and interpretation |
|---|---|---|
| [City Streets — Base/Streets/MapServer/0](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/Streets/MapServer/0) | Polyline; `OBJECTID`, `STREETNAME`, `Segid_2`, `FLOW`, `SPEEDLMT`. One bounded GeoJSON query returned a LineString with allowed fields in WGS84. | Metadata advertises pagination/GeoJSON; max 2,000 records. Street reference, not current closure permission. |
| [Hosted Fay_streets/FeatureServer/0](https://services.arcgis.com/j3zNT485kmwrBtMJ/arcgis/rest/services/Fay_streets/FeatureServer/0) | Existing DTA reference source; `SEG_ID`, `GlobalID`, `STREETNAME`; max 1,000 records. | Different source/schema from City MapServer (`SEG_ID` vs `Segid_2`). Require crosswalk; no ID equivalence assumed. Advertised edit capabilities are not authorization to write. |
| [AddressPoints/MapServer/0](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/AddressPoints/MapServer/0) | Point; `ALLADD`, `ADDRESS`, `PIN`, `LM_NAME`, `SC_NAME`, `Retired`. Address matching and potential parcel linkage. | Metadata max 2,000. Candidate identifiers/labels need semantics and uniqueness checks; not a verified occupancy directory. |
| [Parcels/MapServer/0](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/Parcels/MapServer/0) | Polygon; `NAD83_PIN`, `PIN`, `PARCEL_PK`, `REID`, `LOCATION_ADDR`, `LAND_CLASS`, `ZONING`. | Metadata advertises max 155,000, but connector must impose much smaller pages. Exclude owner/mail/tax/valuation fields from default imports. Parcel geometry/ownership does not identify a tenant business or entrance. |
| [Zoning/MapServer/0](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/Zoning/MapServer/0) | Polygon; `ZNTYPE`, `CAMA_CODE`, `GlobalID`. | Context overlay; zoning does not establish current business activity or authorize use/closure. |
| [Sidewalks/MapServer/0](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Base/Sidewalks/MapServer/0) | Polyline; `FACILITYID`, `GlobalID`, `ParentRoadSegGUID`, width/slope/condition/inspection field names. | Useful engineering context; field existence is not verified condition, network connectivity or accessible routing. Parent reference relationship needs checking. |
| [DowntownParking/MapServer/2](https://gismaps.fayettevillenc.gov/cofpublicgis/rest/services/Services/DowntownParking/MapServer/2) and [open-data MapServer/0](https://gismaps.fayettevillenc.gov/cofopendatagis/rest/services/Administrative/DowntownParking/MapServer/0) | Polygon; `LOTNAME`, `NUMBEROFSPACES`, `Rates`, `GlobalID`, `EditDate_1`. | Similar schemas but distinct service/layer identities; compare versions and rights before choosing authoritative source. Prices/capacity need currency checks. |
| [Parking Map Public View service](https://services.arcgis.com/j3zNT485kmwrBtMJ/arcgis/rest/services/Parking_Map_Public_View/FeatureServer) from [2026 public web map](https://faync.maps.arcgis.com/home/item.html?id=0ab12a7016804d4483a6fff26f86a639) | Web map links spaces (0), payment devices (1), facilities (2), curb zones (3), plus a separate bike-racks layer. Curb-zone schema includes `CURBZONE_ID`, `STREET_SIDE`, `CURB_USE`, `STATUS`, `LAST_VERIFIED`, `POLICY_SUMMARY`. | Curb-zone metadata and bounded count verified; sibling layers discovered through the map, not individually validated. Candidate replacement/enrichment for older parking reference requires review. |

Most inspected City services report spatial reference 102719/latest WKID 2264. Do not interpret native numbers as longitude/latitude. Request and validate `outSR=4326` for GeoJSON; document native CRS/units and any datum transformation for engineering exports. Persist geometry/source CRS and transformation metadata.

## Business data: useful leads, incomplete directory

The public [Business Offering Free Wifi item](https://faync.maps.arcgis.com/home/item.html?id=c44b41cad92545258777a32299049deb) resolves to a [queryable survey layer](https://services.arcgis.com/j3zNT485kmwrBtMJ/arcgis/rest/services/Business_Offering_Free_Wifi_3_view/FeatureServer/0). Its schema contains `business_name`, `address_of_the_business`, `free_wifi`, `globalid`, and `CreationDate`; metadata was modified October 8, 2026. This is a specific Wi-Fi survey, not an authoritative inventory of all active businesses. No business rows were downloaded in this research, and row accuracy/coverage is unverified.

The [downtown land-use web map](https://faync.maps.arcgis.com/home/item.html?id=b565dc852065456887694970babe1979) points to [feature collection c7fd8cc204394cf1a56791fcb8db5af8](https://faync.maps.arcgis.com/home/item.html?id=c7fd8cc204394cf1a56791fcb8db5af8), titled `Export_489_records_021618`, whose item modification is February 19, 2018. The web map itself was modified in 2021. Treat this as historical context until a current authoritative replacement is identified; a map edit date does not refresh its embedded data. The portal business/downtown/parcels searches were exploratory, not an exhaustive citywide inventory.

Proposed identity model:

```text
business (stable internal ID)
  -> location / suite (many over time; valid_from/valid_to)
  -> reviewed address-point links
  -> reviewed parcel links (many-to-many; source-qualified PIN)
  -> reviewed entrance/access points
  -> candidate restriction impacts + review evidence
```

Use normalized street address plus unit and independently sourced business identity, then point-in-polygon/nearby matching to propose links. Address `PIN` and parcel `PIN`/`NAD83_PIN` are candidate crosswalk fields; verify formats, retired records, multiplicity and spatial agreement before joining. Preserve ambiguity for shared buildings, multiple suites/entrances, relocations and boundary points. Store match method/confidence/reviewer/source/version. Never silently overwrite business-managed data or infer contacts from parcel owners. Private contacts/suppression state stay in a separately authorized adapter.

## Connector contract for engineers

1. Discover app → item → web map → service/layer or embedded collection. Record exact endpoint/item/layer, provider identity, terms, selected fields, CRS, capability/schema hash and retrieval time. Allow only approved HTTPS hosts; revalidate redirects to prevent SSRF. Never execute embedded popup HTML or forward credentials to a discovered host.
2. Query MapServer/FeatureServer layers only with advertised read capability. Use bbox, field allowlist and bounded page sizes; handle ArcGIS JSON `error` even with HTTP 200. Handle schema/endpoint changes, timeouts, 429/5xx, deleted items and unavailable sources explicitly.
3. Inspect layer-specific pagination/ID support. Use stable ordered paging or ID batches; respect `exceededTransferLimit`, including a short/empty page that still says more results. Guard against loops, duplicate IDs and changing sources. Reconcile counts/coverage before accepting a snapshot.
4. Preserve `(provider, service URL or item ID, layer ID, source feature ID, dataset version)` as external identity. Prefer a verified durable GlobalID/business key when available; never assume ObjectIDs survive republishing or match across views/services.
5. Stage imports/diffs and retain last accepted reference snapshot. Do not replace accepted data with an empty result after an upstream error. Missing features produce reviewable tombstones/crosswalk changes, not silent relocation of saved plans. Check record and data freshness separately from item/schema edits.
6. Keep connector reads outside map interaction critical paths. Jobs, budgets, receipts and per-tenant quotas govern refresh. Optional authenticated services use scoped server-held credentials; no upstream writes or ArcGIS edit permissions are required.

Esri documents [MapServer layer queries](https://developers.arcgis.com/rest/services-reference/enterprise/query-map-service-layer/) and [FeatureServer queries](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/). Implement against advertised capabilities, not a guessed universal server version. GeoJSON availability was both advertised and sampled on City Streets; no full extraction/pagination or datum-accuracy validation was performed.

## Developer-facing Map Planner contract (proposed)

| Interface | Behavior to specify/test |
|---|---|
| Public layer catalog | `GET /api/v1/public/:org/layers`: layer/schema version, attribution, CRS, coverage, freshness and supported filters; published data only. |
| Closure query | Existing planned public route gains bounded `bbox`, time overlap, layer/event IDs, cursor/page limit and GeoJSON; stable IDs, ETag and snapshot version prevent skipped/mixed pages. |
| Engineering project read | Scoped service identity reads permitted draft project layers/evidence metadata; explicit `published:read`, `project:read`, `draft:write` scopes. No default publish/notify or raw-source access. |
| Draft integration write | Idempotent import/create-draft commands with revision guard and receipt; validate schema/CRS/source provenance and leave review/publication explicit. |
| Impact query | Project-scoped candidate business/parcel/parking relationships with geometry, distance/method, source versions, match uncertainty and reviewed access status; no private contacts in generic engineering payloads. |
| Changes | Replayable publication/update/withdrawal feed with monotonic opaque cursor, retained history window and full-resync path. Optional subscribed webhooks use signed/versioned events, retry/receipt ledger and deduplication; read polling works without subscriptions. |
| GIS interoperability | Demonstrate an actual GeoJSON layer in QGIS and ArcGIS Pro, including CRS/time/status/attribution/null geometry; evaluate a standards adapter and GeoPackage export based on engineer demand. Do not claim FeatureServer/OGC/WFS compatibility until implemented and tested. |
| Documentation/tooling | OpenAPI + JSON Schema, small TypeScript client and Python/curl examples, synthetic sandbox, request IDs/error codes, pagination/retry examples, version/deprecation policy, published rate/size ceilings and changelog. No production credentials in examples. |

Permit/traffic-control drawings and construction/routing systems may consume these outputs as references. Survey-grade accuracy, approved traffic control, live occupancy, available parking, network clearance and emergency routing are not established by this research or by drawing the layers together.

## Bounded live evidence

Anonymous GET/count probes used the test envelope `[-78.89, 35.045, -78.87, 35.06]` in WGS84, an arbitrary downtown test box, not an official district boundary. Counts returned **867 address points**, **1,204 parcels** and **77 curb zones**. These count features intersecting that box; they are not businesses, entrances or confirmed impacts. One street GeoJSON feature was requested to verify a LineString and allowlisted property names; no feature rows are stored in this repo.

See [sanitized research receipts](engineering-gis-evidence.json) for exact URLs, counts and inspected schemas. No exhaustive pagination, business-identity validation, public-hosted planner GIS client roundtrip, viewer visual QA or source-rights determination is claimed.
