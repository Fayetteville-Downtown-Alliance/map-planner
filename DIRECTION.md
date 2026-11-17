# Direction: Map Planner

A planned standalone app for street-closure and event planning, extracted from DTA's
reviewed closures workflow (admin.faydta.com awareness calendar). It is meant for any
organisation and region, with the Fayetteville Downtown Alliance as the first pilot.

Status: dormant (last change 2026-11-09). All four commits landed on one day. The
planning baseline (M0) is complete. No application code exists, and M1 has not started.

## Where it is heading
- **A documentation and extraction baseline first, then code.** The current-state review,
  a source inventory with 148 pinned file hashes, 28 requirements, an architecture
  proposal, a delivery plan with phases M0–M9, and verification and risk registers
  (5f1e938, 84b505b, docs/planning/README.md).
- **Standalone, not a DTA module.** It will have its own identity, storage and deployments,
  with no reuse of DTA SSO cookies or membership (docs/planning/07-decisions-and-risks.md
  D02).
- **Multiple organisations and regions by design.** The pilot covers one region, and a
  synthetic second region proves there are no Fayetteville assumptions (D03;
  docs/planning/03-requirements.md R08).
- **Publish immutable versions.** Published plans become immutable, reviewed versions,
  which deliberately changes DTA's behaviour, where public pages follow later edits
  (D06; docs/planning/04-architecture.md).

## Priorities
1. M1, bootstrap: confirm source and data rights, the pilot region and timezone, and the
   hosting, backend and auth choices. Then create an isolated web/API/domain workspace
   with synthetic seed data (docs/planning/05-delivery-plan.md M1; 08-work-log.md "Next
   work").
2. M2: port the pure closure-domain code from DTA, meaning the validators, topology,
   public projection and fingerprints, with source provenance and adapted tests (05-delivery-plan.md).
3. M3: scoped auth, organisations, versioned plans, atomic revisions, audit trails and
   private sources (05-delivery-plan.md).
4. A signed-in, read-only walkthrough of the live DTA editor. The review had no browser and
   only got 403s (01-current-state-review.md; 08-work-log.md).

## Non-goals and constraints
- DTA remains the operational system through a shadow pilot. One editable master per
  event, and no automatic cutover (README.md; 05-delivery-plan.md "DTA integration and
  eventual cutover").
- Never bulk-copy the DTA root, lockfile, migrations or `wrangler.toml`. Copy selectively
  from a pinned source revision after a rights review (05-delivery-plan.md "Safe copying
  procedure").
- No credentials, database exports, contacts, uploads or production bindings in this
  repo. Real mail delivery is off by default (README.md; D05).
- Publication, private source review, AI import and outbound notices stay separate. AI
  output needs human acceptance (D05; 04-architecture.md).
- The stack starting point is the existing TypeScript/React/MapLibre approach. D1 versus
  PostgreSQL/PostGIS must be benchmarked before choosing (04-architecture.md).
- Small commits with evidence and a work-log update per phase. Planning tags describe
  documentation only, never a deployment (05-delivery-plan.md "Commit discipline").

## Decisions
- 2026-11-09: A planning baseline is delivered first. No source, data, credentials or
  infrastructure are copied at this stage (D01, D07; 84b505b).
- 2026-11-09: A standalone responsive web app with independent identity and storage (D02).
- 2026-11-09: Multi-organisation and multi-region support are requirements. The OSM
  basemap and road topology are separate adapters (D03).
- 2026-11-09: Existing schema and geometry semantics are preserved until a versioned
  migration is tested (D04).
- 2026-11-09: Published versions are immutable and need an explicit review and publish
  step (D06).

## Open questions for the owner
- Q01–Q03 gate M1. Is DTA/Fayetteville the pilot, and which second region? Which backend,
  hosting budget, auth provider and domain? Are there rights to reuse DTA code (no root
  license was found) and City, OSM or parking data? (07-decisions-and-risks.md)
- Is this repo meant to resume soon, or wait until DTA's closures work settles after the
  festival season?

## Related documents
- docs/planning/README.md (index), 01–08 planning documents, source-manifest.json
- scripts/verify-planning.py (link and source-hash checker)
- Source system: the dta repo, docs/program-street-closures.md and docs/closure-release-checklist.md
