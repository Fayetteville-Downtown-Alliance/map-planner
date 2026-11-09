import { spawn } from 'node:child_process'
const children = [
  spawn(process.execPath, ['--watch', '--import', 'tsx', 'apps/api/src/server.ts'], { stdio: 'inherit', env: { ...process.env, LOCAL_SANDBOX: '1' } }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts'], { stdio: 'inherit' }),
]
let stopping = false
function stop(code: number) { if (stopping) return; stopping = true; for (const child of children) child.kill('SIGTERM'); setTimeout(() => process.exit(code), 300).unref() }
for (const child of children) { child.on('error', () => stop(1)); child.on('exit', code => stop(code ?? 1)) }
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
