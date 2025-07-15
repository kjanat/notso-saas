import { createVitestConfig } from '@saas/test-utils/vitest'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default createVitestConfig(__dirname, {
  alias: {
    '@modules': './src/modules',
    '@shared': './src/shared',
  },
  setupFiles: ['./tests/setup.ts'],
})
