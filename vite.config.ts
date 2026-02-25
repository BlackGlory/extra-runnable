import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths()
  ]
, test: {
    typecheck: {
      tsconfig: 'tsconfig.test.json'
    }
  , maxWorkers: 1
  , isolate: false
  }
})
