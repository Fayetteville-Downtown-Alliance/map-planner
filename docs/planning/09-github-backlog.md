# GitHub implementation backlog

Created November 9, 2026. GitHub issues are the current work/status tracker; this index maps them back to the requirements. All application work was open/not started when created.

- Repository: [Fayetteville-Downtown-Alliance/map-planner](https://github.com/Fayetteville-Downtown-Alliance/map-planner).
- Working branch: [`planning/standalone-migration`](https://github.com/Fayetteville-Downtown-Alliance/map-planner/tree/planning/standalone-migration).
- Roadmap: [#1](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/1).
- Original reviewed planning tag: `planning-baseline-2026-11-09` (unchanged).

P0 gates the standalone pilot, P1 covers broader rollout or optional integrations, and P2 covers later expansion. Issue bodies include scope, acceptance criteria and linked prerequisites. Dependencies are documented links, not native GitHub blocking relationships. No implementation assignees or deadlines have been invented.

| Work item | Priority | Requirements | Dependencies |
|---|---|---|---|
| [[M1] Resolve source rights, pilot scope and architecture decisions](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/2) | P0 | R01, R08, R28 | Planning baseline |
| [[M1] Bootstrap an isolated web, API and domain workspace](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/3) | P0 | R01, R28 | [#2](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/2) |
| [[M2] Extract closure validation, geometry and regional time semantics](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/4) | P0 | R05, R06, R07, R09, R10, R16, R20 | [#3](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/3) |
| [[M3] Add organization-scoped identity and capability enforcement](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5) | P0 | R02, R03, R26 | [#4](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/4) |
| [[M3] Implement events, immutable plan versions and conflict-safe saves](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/6) | P0 | R04, R11, R16, R26 | [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5) |
| [[M4] Add versioned City GIS and OSM regional reference adapters](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/7) | P0 | R06, R07, R08, R20 | [#4](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/4), [#2](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/2) |
| [[M4] Build the accessible map editor and recoverable draft workflow](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/8) | P0 | R04, R05, R06, R07, R09, R10, R11, R12, R16 | [#6](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/6), [#7](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/7) |
| [[M3–M4] Store private source attachments and reviewed citations](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/9) | P0 | R02, R13, R26 | [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5), [#6](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/6) |
| [[M5] Separate review, versioned publication and withdrawal](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) | P0 | R15, R16, R19, R26 | [#8](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/8), [#9](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/9) |
| [[M5] Build public day pages, JSON/GeoJSON API and sharing metadata](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/11) | P0 | R17, R20, R25 | [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) |
| [[M4–M5] Add complete exports and retryable map rendering](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/12) | P0 | R18, R19 | [#8](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/8), [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) |
| [[M6] Add optional reviewed OCR and map-import jobs](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/13) | P1 | R14 | [#8](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/8), [#9](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/9), [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) |
| [[M7] Add directory impact candidates and reviewed parking access](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/14) | P1 | R21, R22 | [#7](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/7), [#6](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/6), [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) |
| [[M7] Add versioned calendar/program integration with one editing authority](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/15) | P1 | R23 | [#6](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/6), [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10) |
| [[M7] Implement explicit, reviewed and idempotent notifications](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/16) | P1 | R24 | [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10), [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5) |
| [[M7] Add aggregate analytics and bounded retention](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/17) | P1 | R27 | [#11](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/11), [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5) |
| [[M1–M8] Establish security, mobile and operational release gates](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/18) | P0 | R02, R12, R26, R28 | [#3](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/3) |
| [[M8] Reconcile live source and run a read-only shadow migration pilot](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/19) | P0 | R01, R15, R17, R18, R20, R28 | [#11](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/11), [#12](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/12), [#18](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/18) |
| [[M9] Benchmark multi-tenant regional scale and plan rollout capacity](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/20) | P2 | R02, R08, R20, R28 | [#19](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/19) |

The original R01–R28 requirements are covered above. R29–R34 extend the backlog below. Optional deferred scope must be recorded explicitly for a release; issue closure alone does not prove production acceptance.

Original dependency order was #2 → #3. Bootstrap #3 is now closed; production decisions #2 and operations #18 remain open. Current GIS follow-up is tracked under #26/#25, with actual coverage below and in implementation status.

The original two planning commits and their tag were pushed to `main` at the user’s request. This backlog index is a follow-up on `planning/standalone-migration`. Source application files, real data and infrastructure remain untouched.

## Engineering/GIS integration extension

Researched November 9, 2026: [verified sources and engineering API design](10-engineering-gis-integrations.md). Roadmap #1 now links 24 work issues (#2–#25), covering R01–R34. All five new issues were open/not started when created; related issues #7, #11, #14 and #18 link this extension.

| Work item | Priority | Requirements | Dependencies |
|---|---|---|---|
| [[M4] Add read-only ArcGIS discovery and reference ingestion](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/21) | P0 | R29 | [#7](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/7), [#3](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/3) |
| [[M7] Link businesses to reviewed addresses, parcels and entrances](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/22) | P1 | R30 | [#14](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/14), [#21](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/21) |
| [[M3–M5] Publish engineering API contracts and scoped machine access](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/23) | P0 | R31, R32 | [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5), [#11](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/11) |
| [[M7] Add replayable publication changes and optional signed webhooks](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/24) | P1 | R33 | [#10](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/10), [#23](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/23) |
| [[M7] Verify QGIS and ArcGIS Pro interoperability and coordinate handling](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/25) | P1 | R34 | [#12](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/12), [#23](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/23) |

## Runnable sandbox and GIS stack comparison

The first original synthetic sandbox is implemented; see [current implementation evidence and limits](../implementation/status.md). Issue creation state above is historical; GitHub issues hold current work status. The bootstrap is separate from production tenancy, full geometry editing and real data migration.

[Issue #26](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/26) tracks the researched QGIS-compatible editor comparison (R06/R08/R29–R34). [The comparison](../research/2026-11-09-qgis-web-gis-options.md) recommends QGIS desktop interoperability, retaining the current MapLibre app during a Geoman/OpenLayers spike, and prioritizing PostGIS in the spatial backend evaluation. QGIS Server/QWC2 remains an optional project-publishing service. No extra GIS stack was installed/deployed by the research.


### Implemented GIS slice

[ADR 002](../implementation/adr-002-source-bound-gis.md) now selects OpenLayers for bounded source-limit editing, retains MapLibre/Geoman Free comparison paths, and implements versioned source references, projected curve clipping, canonical API validation and flat public provenance. Independent QGIS 3.34.4 and PostGIS 3.4.2 CI proofs passed at `9f42832`; final evidence follows the radius-boundary and gesture checks. #25/#26 remain open for current desktop clients, ArcGIS Pro, real data, generic drawing/topology and realistic load/physical-device acceptance. #21 is still metadata-only, and #22 has no imported business data.

[Issue #27](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/27) now scopes the next PostGIS application-adapter prototype: immutable source registry, tenant/capability enforcement, bounded spatial queries, reviewed entrance candidates and representative 10k/100k synthetic benchmarks. The current SQL proof does not implement that adapter or production authorization.
