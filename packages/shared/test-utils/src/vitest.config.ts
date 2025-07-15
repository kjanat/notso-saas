import path from 'path'
import { defineConfig } from 'vitest/config'

export function createVitestConfig(
  dirname: string,
  options?: {
    setupFiles?: string[]
    alias?: Record<string, string>
  }
) {
  return defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
        '@saas/database': path.resolve(dirname, '../../packages/database/src'),
        '@saas/shared': path.resolve(dirname, '../../packages/shared'),
        ...options?.alias,
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
          branches: 75,
          functions: 90,
          lines: 80,
          statements: 80,
        },
      },
      environment: 'node',
      globals: true,
      hookTimeout: 10000,
      setupFiles: options?.setupFiles || [path.resolve(dirname, './tests/setup.ts')],
      testTimeout: 10000,
    },
  })
}
