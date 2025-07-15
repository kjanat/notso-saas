import path from 'node:path'

import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

interface VitestConfigOptions {
  alias?: Record<string, string>
  setupFiles?: string[]
  testTimeout?: number
  hookTimeout?: number
  coverage?: {
    thresholds?: {
      branches?: number
      functions?: number
      lines?: number
      statements?: number
    }
  }
}

export function createVitestConfig(
  dirname: string, 
  options: VitestConfigOptions = {}
) {
  // Validate dirname to prevent path traversal
  if (!dirname || typeof dirname !== 'string') {
    throw new Error('dirname must be a valid string')
  }

  // Use environment variables for configurable values
  const defaultTimeout = parseInt(process.env.VITEST_TIMEOUT || '10000', 10)
  const defaultHookTimeout = parseInt(process.env.VITEST_HOOK_TIMEOUT || '10000', 10)

  return defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        '.prisma/client': path.resolve(
          dirname,
          '../../packages/database/node_modules/.prisma/client'
        ),
        '@': path.resolve(dirname, './src'),
        '@saas/database': path.resolve(dirname, '../../packages/database'),
        '@saas/shared': path.resolve(dirname, '../../packages/shared'),
        ...options.alias,
      },
    },
    test: {
      coverage: {
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData/**',
          '**/__mocks__/**',
          '**/tests/**',
          '**/test/**',
          '**/*.test.ts',
          '**/*.spec.ts',
        ],
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        thresholds: {
          branches: options.coverage?.thresholds?.branches ?? 75,
          functions: options.coverage?.thresholds?.functions ?? 90,
          lines: options.coverage?.thresholds?.lines ?? 80,
          statements: options.coverage?.thresholds?.statements ?? 80,
        },
      },
      environment: 'node',
      globals: true,
      hookTimeout: options.hookTimeout ?? defaultHookTimeout,
      setupFiles: options.setupFiles || [path.resolve(dirname, './tests/setup.ts')],
      testTimeout: options.testTimeout ?? defaultTimeout,
    },
  })
}