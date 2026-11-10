import { bindings, defineConfig, defineWorker, exports } from 'cf/config'
import * as entrypoint from './apps/worker/src/index.ts' with { type: 'cf-worker' }
import { execFileSync } from 'node:child_process'
const workspaceWorker = defineWorker({
    name: 'map-planner-preview', entrypoint,
    compatibilityDate: '2026-11-09', compatibilityFlags: ['nodejs_compat'],
    workersDev: true, previewUrls: true,
    assets: { runWorkerFirst: true, notFoundHandling: 'none', htmlHandling: 'none' },
    observability: { enabled: true, redactQueryString: true, logs: { enabled: true, invocationLogs: false }, traces: { enabled: true, headSamplingRate: .01 } },
    exports: { PreviewWorkspace: exports.durableObject({ storage: 'sqlite' }) },
})
export default defineConfig({
  accountId: '04eac09ae835290383903273f68c79b0',
  worker: {
    ...workspaceWorker,
    env: {
      ASSETS: bindings.assets(), PREVIEW_SESSION_KEY: bindings.secret(),
      BUILD_REVISION: bindings.text(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()),
      WORKSPACES: bindings.durableObject({ worker: workspaceWorker, exportName: 'PreviewWorkspace' }),
      SESSION_LIMITER: bindings.rateLimit({ namespace: '168452721', simple: { limit: 10, period: 60 } }),
      REQUEST_LIMITER: bindings.rateLimit({ namespace: '168452722', simple: { limit: 120, period: 60 } }),
    },
  },
})
