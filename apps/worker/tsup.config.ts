import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  target: 'node22',
  external: ['@prisma/client'],
})
