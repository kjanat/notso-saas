import { createVitestConfig } from '@saas/test-utils/vitest'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default createVitestConfig(__dirname)
