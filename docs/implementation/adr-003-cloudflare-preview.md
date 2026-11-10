# ADR 003: isolated Cloudflare Worker preview

November 9, 2026. The user explicitly requested implementation through a working Cloudflare Worker preview URL. This supersedes ADR 001's loopback-only hosting boundary **for this separate synthetic preview**, while retaining the original loopback adapter and all production/data-rights gates.

## Deployment boundary

Use the project-pinned `cf` CLI and `cloudflare.config.ts`, with Cloudflare's matching Vite beta plugin and Workers Static Assets. No Wrangler configuration, Pages project, DNS/custom-domain changes, DTA resource bindings, contacts, database export, real feature data or outbound-delivery transport is introduced. A new `map-planner-preview` Worker uses the account already hosting DTA services; existing Workers remain untouched. Its own SQLite Durable Object class is `PreviewWorkspace`.

The original Node SQLite adapter remains available. The common store now receives a synchronous database/transaction interface. Node uses BEGIN/COMMIT/ROLLBACK; a Durable Object uses `storage.transactionSync`, retaining command-body hashes, idempotency receipts, atomic revisions, audit/version history, publication snapshots and canonical reference validation. This is preview persistence, not a PostGIS production-backend decision or migration.

## Browser workspace isolation

- Each browser receives a random 256-bit workspace identity in a signed, host-only `__Host-` cookie with Secure, HttpOnly and SameSite=Lax. Lax preserves work when the user follows an external link to the preview; API requests also reject foreign Origin/cross-site requests and retain JSON/custom-header mutation checks.
- HMAC-SHA256 signatures and fixed expiry are verified before selecting a Durable Object. Arbitrary/expired/modified cookies cannot select an existing workspace. No user-provided organization/header selects storage.
- Every visitor has independent synthetic records and publication state. The preview's “public” reader is scoped to that browser's cookie; it is not an organization publication endpoint across visitors. No production user sign-in, staff roles or machine access is claimed.
- Session bootstrap completes before event loading. Device drafts and pending create operations use the server's non-secret workspace scope, preventing session expiry/change from replaying another workspace's pending operation. Old loopback draft keys remain readable.
- Sessions expire after seven days. A Durable Object alarm deletes that workspace's storage; clearing cookies also loses browser access. The UI explains this before work. This preview is not a durable archive for real/private work.
- New sessions are limited to 10/minute per connecting IP and API traffic to 120/minute per IP, using dedicated Cloudflare rate-limit namespaces. Each workspace has at most 30 events and 1,000 accepted operations. These demo limits are not an account-wide abuse/cost guarantee or production fairness/SLO result.
- The hosted preview disables external GIS schema fetching and has no uploads/AI/mail/notification bindings. CSP, frame denial, nosniff, same-origin referrer policy and private/no-store API responses are applied. Missing hashed assets return 404/no-store, with no HTML fallback.

## CLI, secrets and reproducibility

The existing global CLI is beta.12. Pin `cf` beta.28 and matching `@cloudflare/vite-plugin` beta.v.13 here: the older package's transitive dependency audit contained high-severity advisories; the pinned replacement audit is clean. Leave the global installation unchanged.

```sh
npm ci --ignore-scripts
npm run check
npm run build:worker
npm run test:worker
npx cf deploy --prebuilt --dry-run --secrets-file .data/preview-secrets.json
npx cf deploy --prebuilt --secrets-file .data/preview-secrets.json
```

The signing key is newly generated for this preview, stored only in an ignored mode-600 file and uploaded as a Worker secret. Keep that file for redeployment; do not rotate it accidentally or copy an existing service's credentials. CI generates its own ephemeral `.dev.vars` key for local tests and never receives deployment credentials. No credential or session-cookie values belong in committed evidence.

Build output is `.cloudflare/output/v0/`; `BUILD_REVISION` captures the exact Git commit at build time. Rebuild from a clean commit before deploying and verify `/api/health` reports that same revision. `npm run preview:worker` runs the built Worker on HTTPS loopback port 8790 with a generated local certificate; local tests allow that self-signed certificate, while remote tests require valid public TLS. Secure cookies are not weakened to make HTTP/WebKit tests pass.

The root HTML is served through the Worker with no-store and explicit asset HTML handling, preventing a redirect from losing the initial session cookie. Separate Node and Workers TypeScript configurations prevent global runtime declaration drift. Worker Env/binding types are generated from configuration; the Durable Object binding uses a typed Worker definition and RPC.

## Verification and release limits

Source tests cover signature forgery/expiry/key changes and device-draft/pending-write scope changes. Workers-runtime/browser tests cover independent sessions, cross-workspace event/receipt denial, same-operation replay, changed-body conflict, stale revision, blocked external metadata, origin/forged-cookie rejection, asset 404s, actual maps under CSP, reload/draft recovery and explicit publish/withdraw/private projection in Chromium and phone WebKit. The existing browser/domain/GIS suites remain required.

The quality workflow builds and tests the Worker locally, alongside Node/browser and independent QGIS/PostGIS checks. It does not auto-deploy or establish branch protection. Verify the deployed URL with the same hosted tests and exact build health before recording a preview release. Physical devices, full production identity, restore operations, realistic scale, real City/business imports, PostGIS adapter and GIS desktop acceptance remain open.

Relevant official references: [cf CLI](https://github.com/cloudflare/cf), [Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/), [Durable Object SQLite](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/). Installed package declarations and runtime behavior were used where the beta CLI documentation URLs were unavailable.
