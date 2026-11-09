import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include:['packages/**/*.test.ts','apps/**/*.test.ts','apps/**/*.test.tsx'], maxWorkers:2, restoreMocks:true } })
