import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: true,
  clean: true,
  dts: false,
  entry: ['src/main.ts'],
  format: ['esm'],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  splitting: false,
  target: 'node22',
})
