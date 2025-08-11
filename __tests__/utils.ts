import path from 'path'
import { fileURLToPath } from 'url'

export function getFixturePath(...paths: string[]): string {
  return path.join(
    fileURLToPath(new URL('fixtures', import.meta.url))
  , ...paths
  )
}
