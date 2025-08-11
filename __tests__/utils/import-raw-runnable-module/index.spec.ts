import { describe, test, expect } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { importRawRunnableModule } from '@utils/import-raw-runnable-module.js'
import { getErrorPromise } from 'return-style'

describe('importRawRunnableModule', () => {
  test('default only', async () => {
    const module = await importRawRunnableModule(getFixturePath('default-only.js'))

    expect(module).toStrictEqual({
      default: expect.any(Function)
    , destroy: undefined
    })
  })

  test('default and destroy', async () => {
    const module = await importRawRunnableModule(getFixturePath('default-and-destroy.js'))

    expect(module).toStrictEqual({
      default: expect.any(Function)
    , destroy: expect.any(Function)
    })
  })

  test('top-level-await', async () => {
    const module = await importRawRunnableModule(getFixturePath('top-level-await.js'))

    expect(module).toStrictEqual({
      default: expect.any(Function)
    , destroy: undefined
    })
  })

  test('invalid', async () => {
    const err = await getErrorPromise(
      importRawRunnableModule(getFixturePath('invalid.js'))
    )

    expect(err).toBeInstanceOf(Error)
  })

  test('error', async () => {
    const err = await getErrorPromise(
      importRawRunnableModule(getFixturePath('error.js'))
    )

    expect(err).toBeInstanceOf(Error)
  })

  test('not found', async () => {
    const err = await getErrorPromise(
      importRawRunnableModule(getFixturePath('not-found.js'))
    )

    expect(err).toBeInstanceOf(Error)
  })
})

function getFixturePath(...paths: string[]): string {
  return path.join(
    fileURLToPath(new URL('fixtures', import.meta.url))
  , ...paths
  )
}
