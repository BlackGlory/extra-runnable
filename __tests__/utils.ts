import * as path from 'path'

export function getFixturePath(name: string): string {
  return path.join(__dirname, 'fixtures', name)
}
