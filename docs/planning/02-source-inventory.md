# Source inventory and extraction boundaries

Source revision: `66a0ebc2510d4ffb0db403fdee10d378ddc57d42`. SHA-256 values are in [source-manifest.json](source-manifest.json). No source application files were copied in this planning stage.

## Port map

| Source group | Proposed destination | Treatment |
|---|---|---|
| Shared plan, street positions, fingerprints, public projection | `packages/domain` | Extract pure logic with behavior tests; remove DTA alias imports. |
| City street/parking JSON | `packages/reference-data` | Keep provenance/version and regional namespace; verify redistribution rights. |
| OrganizerNotes, street editor, map/export components | `apps/web` and `packages/map-ui` | Adapt to standalone event workspace and auth client. |
| Awareness-calendar handlers | `apps/api` event/plan routes | Rewrite repository/auth boundaries; do not copy whole calendar/governance system. |
| Public road-closure reader/OpenAPI/SEO | `apps/api` public routes and `apps/web` public guide | Preserve projection, dates and geometry semantics; introduce explicit version contract. |
| Import/OCR/zoom code | `packages/import` and job worker | Server-only providers; preserve independent source check and human review. |
| Business/parking impact | Domain matchers + directory adapter | Remove roster access and fixed city bounds from core. |
| Courtesy/provider mail | Optional delivery adapter | Disabled initially; implement explicit send/review/idempotency. |
| Existing regression fixtures/tests | Matching packages | Copy only sanitized synthetic fixtures and permitted source; rewrite imports. |

## Do not copy

- `.env*`, credentials, signing keys, cookies, token-bearing URLs, private contacts, inbound emails, real City uploads or production database dumps.
- Existing D1/R2/KV/queue IDs, Cloudflare account configuration, service bindings or deployment scripts that can target DTA.
- DTA billing, memberships, board governance, shared inbox, assistant, subscriptions or organization-wide user tables.
- Real recipient lists, historical outbound jobs, provider email assumptions or automatic publication hooks.
- Event-specific Homecoming/parade presets into generic production behavior; use authorized/synthetic regression examples only.

## Candidate files

This intentionally broad inventory includes tests and integration boundaries to inspect; it is not an installable source tree. Every selected file must receive an import/dependency and privacy/license review before copying.

| DTA path |
|---|
| `.planning/road-closure-apis-reference.md` |
| `.planning/road-closure-improvements-roadmap.md` |
| `apps/admin/functions/_middleware.ts` |
| `apps/admin/functions/api/admin/analytics/road-closures.ts` |
| `apps/admin/functions/api/admin/awareness-calendar.ts` |
| `apps/admin/functions/api/admin/awareness-calendar/[id].ts` |
| `apps/admin/functions/api/admin/awareness-calendar/[id]/closure-businesses.ts` |
| `apps/admin/functions/api/admin/awareness-calendar/[id]/closure-draft.ts` |
| `apps/admin/functions/api/admin/closure-confirmation-emails.ts` |
| `apps/admin/functions/api/admin/dashboard/closure-warnings.test.ts` |
| `apps/admin/functions/api/admin/dashboard/closure-warnings.ts` |
| `apps/admin/functions/api/admin/producer/events/[slug]/closure-businesses.ts` |
| `apps/admin/functions/api/admin/producer/events/[slug]/closure-draft.ts` |
| `apps/admin/functions/api/admin/program-review/[slug]/closure-businesses.ts` |
| `apps/admin/functions/api/admin/program-review/[slug]/closure-draft.ts` |
| `apps/admin/functions/api/admin/program-review/[slug]/closure-invite.ts` |
| `apps/admin/functions/api/admin/program-review/[slug]/closure-link.ts` |
| `apps/admin/functions/lib/awareness-calendar.ts` |
| `apps/admin/functions/lib/closure-businesses.test.ts` |
| `apps/admin/functions/lib/closure-businesses.ts` |
| `apps/admin/functions/lib/closure-courtesy-assets.ts` |
| `apps/admin/functions/lib/closure-courtesy-contacts.ts` |
| `apps/admin/functions/lib/closure-courtesy-draft.ts` |
| `apps/admin/functions/lib/closure-courtesy-email.test.ts` |
| `apps/admin/functions/lib/closure-courtesy-email.ts` |
| `apps/admin/functions/lib/closure-import.test.ts` |
| `apps/admin/functions/lib/closure-import.ts` |
| `apps/admin/functions/lib/closure-source-facts.test.ts` |
| `apps/admin/functions/lib/closure-source-facts.ts` |
| `apps/admin/functions/lib/closure-zoom.test.ts` |
| `apps/admin/functions/lib/closure-zoom.ts` |
| `apps/admin/functions/lib/mapping-provider-notification.ts` |
| `apps/admin/src/App.tsx` |
| `apps/admin/src/components/ClosureBusinessImpact.tsx` |
| `apps/admin/src/components/ClosureCourtesyEmail.test.tsx` |
| `apps/admin/src/components/ClosureCourtesyEmail.tsx` |
| `apps/admin/src/components/ClosureDetourFields.tsx` |
| `apps/admin/src/components/ClosureImport.tsx` |
| `apps/admin/src/components/ClosureParkingImpact.tsx` |
| `apps/admin/src/components/ClosureSourceFields.tsx` |
| `apps/admin/src/components/ClosureTimeInput.tsx` |
| `apps/admin/src/components/OrganizerNotes.tsx` |
| `apps/admin/src/components/StreetClosureExport.tsx` |
| `apps/admin/src/components/StreetClosureMap.tsx` |
| `apps/admin/src/components/StreetClosureSummary.tsx` |
| `apps/admin/src/components/StreetExtentEditor.tsx` |
| `apps/admin/src/lib/closure-map-export.ts` |
| `apps/admin/src/lib/closure-map-orientation.ts` |
| `apps/admin/src/lib/closure-map.ts` |
| `apps/admin/src/lib/closure-phases.ts` |
| `apps/admin/src/lib/closure-plan-pdf.ts` |
| `apps/admin/src/lib/closure-planning.ts` |
| `apps/admin/src/lib/closure-public-map.ts` |
| `apps/admin/src/lib/closure-response.test.ts` |
| `apps/admin/src/lib/closure-response.ts` |
| `apps/admin/src/lib/closure-source-media.ts` |
| `apps/admin/src/lib/closure-zoom.test.ts` |
| `apps/admin/src/lib/closure-zoom.ts` |
| `apps/admin/src/lib/homecoming-closure-draft.test.ts` |
| `apps/admin/src/lib/homecoming-closure-draft.ts` |
| `apps/admin/src/pages/AwarenessClosuresPage.tsx` |
| `apps/admin/src/pages/ClosureEmailDraftPage.test.tsx` |
| `apps/admin/src/pages/ClosureEmailDraftPage.tsx` |
| `apps/admin/src/pages/RoadClosureAnalyticsPage.tsx` |
| `apps/admin/tests/awareness-closure-businesses.test.ts` |
| `apps/admin/tests/awareness-closure-detail.test.ts` |
| `apps/admin/tests/awareness-closures-page.test.tsx` |
| `apps/admin/tests/closure-business-impact.test.tsx` |
| `apps/admin/tests/closure-confirmation-emails.test.ts` |
| `apps/admin/tests/closure-import-map-suggestion.test.tsx` |
| `apps/admin/tests/closure-import.test.tsx` |
| `apps/admin/tests/closure-map-export.test.ts` |
| `apps/admin/tests/closure-parking-review.test.tsx` |
| `apps/admin/tests/closure-phases.test.ts` |
| `apps/admin/tests/closure-plan-pdf.test.ts` |
| `apps/admin/tests/closure-planning.test.ts` |
| `apps/admin/tests/closure-quoted-road-source.test.ts` |
| `apps/admin/tests/mapping-provider-notification.test.ts` |
| `apps/admin/tests/organizer-closures.test.tsx` |
| `apps/admin/tests/road-closure-analytics-report.test.ts` |
| `apps/admin/tests/street-closure-map.test.tsx` |
| `apps/main/functions/_middleware.ts` |
| `apps/main/functions/_shared/public-road-closure-image.ts` |
| `apps/main/functions/_shared/public-road-closures.ts` |
| `apps/main/functions/_shared/road-closure-analytics.ts` |
| `apps/main/functions/api/road-closures.test.ts` |
| `apps/main/functions/api/road-closures.ts` |
| `apps/main/functions/api/road-closures/events.ts` |
| `apps/main/functions/api/road-closures/maps/[id].ts` |
| `apps/main/functions/api/road-closures/openapi.json.ts` |
| `apps/main/functions/api/road-closures/parking.ts` |
| `apps/main/functions/road-closures/[date].ts` |
| `apps/main/functions/road-closures/index.ts` |
| `apps/main/migrations/075_market_house_green_street_closure.sql` |
| `apps/main/migrations/251_awareness_calendar_city_closure_list.sql` |
| `apps/main/migrations/252_awareness_calendar_closure_detail.sql` |
| `apps/main/migrations/361_offering_location_and_street_closures.sql` |
| `apps/main/migrations/370_program_street_closure_plan.sql` |
| `apps/main/migrations/371_awareness_street_closure_plan.sql` |
| `apps/main/migrations/372_public_road_closure_days.sql` |
| `apps/main/migrations/375_closure_courtesy_emails.sql` |
| `apps/main/migrations/377_closure_business_contact_links.sql` |
| `apps/main/migrations/399_road_closure_daily.sql` |
| `apps/main/src/App.tsx` |
| `apps/main/src/components/ProgramStreetClosures.tsx` |
| `apps/main/src/components/PublicRoadClosureMap.tsx` |
| `apps/main/src/components/RoadClosureMapImage.tsx` |
| `apps/main/src/components/RoadClosureParking.tsx` |
| `apps/main/src/components/UpcomingRoadClosures.tsx` |
| `apps/main/src/lib/road-closure-analytics.ts` |
| `apps/main/src/pages/RoadClosuresPage.test.tsx` |
| `apps/main/src/pages/RoadClosuresPage.tsx` |
| `apps/main/tests/road-closure-analytics.test.ts` |
| `docs/closure-image-import-audit.md` |
| `docs/closure-release-checklist.md` |
| `docs/program-street-closures.md` |
| `docs/road-closures-api.md` |
| `packages/shared/src/closure-business-impact.test.ts` |
| `packages/shared/src/closure-business-impact.ts` |
| `packages/shared/src/closure-courtesy-media.ts` |
| `packages/shared/src/closure-email-citation.test.ts` |
| `packages/shared/src/closure-email-citation.ts` |
| `packages/shared/src/closure-import.test.ts` |
| `packages/shared/src/closure-import.ts` |
| `packages/shared/src/closure-map-review.test.ts` |
| `packages/shared/src/closure-map-review.ts` |
| `packages/shared/src/closure-parking-impact.test.ts` |
| `packages/shared/src/closure-parking-impact.ts` |
| `packages/shared/src/closure-parking.generated.json` |
| `packages/shared/src/closure-plan-fingerprint.ts` |
| `packages/shared/src/closure-traffic-legend.ts` |
| `packages/shared/src/downtown-streets.json` |
| `packages/shared/src/dues-disclosure.ts` |
| `packages/shared/src/public-road-closures.test.ts` |
| `packages/shared/src/public-road-closures.ts` |
| `packages/shared/src/road-closure-analytics.ts` |
| `packages/shared/src/road-closure-seo.test.ts` |
| `packages/shared/src/road-closure-seo.ts` |
| `packages/shared/src/road-closures.openapi.json` |
| `packages/shared/src/street-closures.test.ts` |
| `packages/shared/src/street-closures.ts` |
| `packages/shared/src/street-positions.test.ts` |
| `packages/shared/src/street-positions.ts` |
| `scripts/build-road-closures-docs.mjs` |
| `scripts/deploy-road-closures.mjs` |
| `scripts/road-closure-process.test.mjs` |
| `scripts/sync-closure-parking.mjs` |
| `scripts/verify-road-closure-preview.mjs` |
