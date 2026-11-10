# Cloudflare preview release

Live URL: [Map Planner preview](https://map-planner-preview.wemea-5ahhf.workers.dev/)

First deployed and verified November 9, 2026. Work branch: `planning/standalone-migration`. This is a synthetic demonstration with one browser workspace per signed cookie; workspaces expire after seven days. Publications remain inside that workspace. Production sign-in, shared organizational publishing, real City/business imports and outbound delivery are not enabled.

## Exact initial deployment

- Worker: `map-planner-preview`; own SQLite Durable Object class `PreviewWorkspace`.
- Application source: `8ed769a4abbd9ad7b5387af514da367e52d817aa`.
- Cloudflare version: `f199558f-c201-4f84-af91-94bc2ebd182b`.
- Health: `/api/health` returned 200, `isolated-synthetic-preview`, `0.1.0-alpha.3`, matching source revision and `outboundDelivery: false`.
- [CI 42739123306](https://github.com/Fayetteville-Downtown-Alliance/map-planner/actions/runs/42739123306) passed both jobs: 29 source tests, 21 loopback browser cases, four Workers-runtime/browser cases, and independent QGIS/PostGIS checks.
- The same four Workers cases passed against the real URL with valid public TLS: desktop Chromium and phone WebKit emulation, all three renderers under CSP, save/device-draft recovery/reload, publish/private projection/withdraw, separate workspace event/receipt denial, operation replay/body conflict, stale revision, origin/forged-cookie denial, blocked external metadata and missing-asset 404s.
- Reviewed the deployed phone screenshot. No physical-device, assistive-technology, enterprise identity, large-layer performance or GIS desktop-client acceptance is claimed.

The follow-up documentation commit is redeployed from a clean tree using the same secret and namespace; the alpha.3 annotated tag records the final revision/version/CI and persistence-check receipt. The actual implementation is unchanged by this receipt update. An existing synthetic event/operation was retained for the cross-version read-back check; no private cookie/key is stored in Git.

## Reproduce and operate

Read [ADR 003](adr-003-cloudflare-preview.md) for local HTTPS tests, `cf` commands, secret handling and limits. `npm run build:worker` captures current Git identity. Deploy the clean build with the pinned CLI and existing preview signing secret; verify the reported revision before declaring acceptance. CI has no deployment credentials or automatic production release.

The preview root, API and health are no-store; static assets are hashed. Worker logs avoid request bodies/cookies and query strings, with sampled traces. HMAC cookies use Secure/HttpOnly/host-only/SameSite=Lax. Per-IP issuance/API and per-workspace write/event limits bound the demo; they do not establish account-wide cost protection or production authorization. Each workspace's cleanup alarm is scheduled for expiry; an actual seven-day retention drill has not yet elapsed.

Issues [#28](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/28) (this preview), [#5](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/5) (production identity), [#18](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/18) (operational release gates), and [#27](https://github.com/Fayetteville-Downtown-Alliance/map-planner/issues/27) (PostGIS application adapter) distinguish preview completion from production acceptance.
