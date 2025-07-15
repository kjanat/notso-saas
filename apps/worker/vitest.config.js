import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createVitestConfig } from '@saas/test-utils/vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default createVitestConfig(__dirname)
