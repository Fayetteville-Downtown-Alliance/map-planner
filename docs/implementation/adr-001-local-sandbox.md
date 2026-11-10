# ADR 001: independent synthetic sandbox

Accepted for local development, November 9, 2026. This does not select or approve a production host, identity provider, cloud budget, dataset license or cutover.

- Create original TypeScript code here; do not copy DTA source, City/OSM extracts, branding or real business/contact data. The repository MIT license applies to this original implementation. Upstream code/data rights remain issue #2.
- Start with npm workspaces: React/Vite web client, Hono API, runtime-independent domain package and a read-only GIS metadata adapter. Versions are locked. No scaffold generator or Sites deployment is used for this explicitly repository-local implementation.
- Use Node 24–26 and a new local SQLite database at `.data/planner.sqlite`. The API/store boundary leaves production storage replaceable. PostgreSQL/PostGIS vs a Workers/D1 adapter remains a measured production decision; no benchmark or cloud provisioning is claimed.
- Server starts only with `LOCAL_SANDBOX=1`, rejects `NODE_ENV=production`, binds `127.0.0.1:8788`, and fixes the synthetic principal/workspace server-side. Host/origin guards and a custom mutation header protect local browser use; this is not production identity or tenant onboarding. Do not expose it through a tunnel or public proxy.
- Demo regions use America/New_York and America/Los_Angeles, original fictitious streets, and synthetic events. Partial ranges, arbitrary map editing and real region imports are later work.
- Revision-guarded transactional saves, operation receipts, version/audit history and explicit publication/withdrawal form a local vertical slice. No email, provider notification, subscriber, AI, upload or outbound-delivery client is present.
- Saving edits preserves the prior publication snapshot. Public JSON/GeoJSON selects safe fields and supports single-day overlap/ETag; public deployment, richer catalog/filter/pagination/schema contracts remain separate issues.
- GIS source inspection is an explicit user action: fetch metadata from three pre-approved exact layer URLs, refuse redirects and oversized/error responses, return only inert schema facts. No feature import or upstream edit operation is implemented. Rights remain unreviewed.
- Device drafts and pending command snapshots persist before submission. Conflicts preserve local work; lost write responses reconcile via receipts rather than creating a new operation. Production protected-draft identity/storage policy remains future work.

## Design references and verification intent

DTA source was still clean at `66a0ebc2510d4ffb0db403fdee10d378ddc57d42` during this implementation. Reviewed the existing awareness editor, public closures page and component inventory for workflow behavior; no application code was copied.

Compared the [GOV.UK check-answers pattern](https://design-system.service.gov.uk/patterns/check-answers/) with [USWDS form templates](https://designsystem.digital.gov/templates/form-templates/) on November 9, 2026. Adapted the separation of editing, readable review and a distinct final action, with inline errors and visible labels. These were interaction references, not imported component code/styles. New visual tokens use a restrained slate/teal work surface, 18px body text, 48px controls and responsive form/list layout. No new animation or motion dependency is used.

Run domain/API/database/client tests, built-client browser workflow checks and local HTTP checks. Browser fixtures prohibit upstream traffic. Physical iPhone/Android, software-keyboard, assistive-technology, QGIS/ArcGIS Pro and production acceptance remain separate.

## Authorized hosted-preview extension

The user's subsequent request for a Cloudflare Worker preview is implemented separately in [ADR 003](adr-003-cloudflare-preview.md). Its isolated browser workspaces do not relax this original Node server's loopback guard or the production identity/data gates.
