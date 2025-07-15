import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createVitestConfig } from '@saas/test-utils/vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default createVitestConfig(__dirname, {
  alias: {
    '@modules': './src/modules',
    '@shared': './src/shared',
  },
  setupFiles: ['./tests/setup.ts'],
})
