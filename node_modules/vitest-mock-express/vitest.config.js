import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    isolate: true,
    include: ['src/test/**/*.test.ts'],
  },
})
