import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function getFixturePath(...paths: string[]): string {
  return path.join(
    fileURLToPath(new URL('fixtures', import.meta.url))
  , ...paths
  )
}
