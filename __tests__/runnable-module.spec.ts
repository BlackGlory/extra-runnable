import { describe, test, expect, beforeEach, afterAll } from 'vitest'
import { getErrorAsync, getErrorPromise } from 'return-style'
import { RunnableModule } from '@src/runnable-module.js'
import { getFixturePath } from '@test/utils.js'
import { AbortError } from 'extra-abort'
import { remove } from 'extra-filesystem'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

const stateFilename = path.join(os.tmpdir(), 'extra-runnable-test')

beforeEach(() => remove(stateFilename))
afterAll(() => remove(stateFilename))

describe('RunnableModule', () => {
  describe('init', () => {
    test('valid', async () => {
      const runnable = new RunnableModule(getFixturePath('valid.js'))

      await runnable.init()

      expect(await fs.readFile(stateFilename, 'utf-8')).toBe('inited')
    })

    test('invalid', async () => {
      const runnable = new RunnableModule(getFixturePath('invalid.js'))

      const err = await getErrorPromise(runnable.init())

      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('run', () => {
    test('result', async () => {
      const runnable = new RunnableModule(getFixturePath('valid.js'))
      await runnable.init()

      const result = await runnable.run('echo', 'foo')

      expect(result).toStrictEqual(['foo'])
    })

    test('error', async () => {
      const runnable = new RunnableModule(getFixturePath('valid.js'))
      await runnable.init()

      const err = await getErrorAsync(() => runnable.run('error'))

      expect(err).toBeInstanceOf(Error)
    })
  })

  test('abort', async () => {
    const runnable = new RunnableModule(getFixturePath('valid.js'))
    await runnable.init()

    const promise = getErrorPromise(runnable.run('loop'))
    runnable.abort()
    const err = await promise

    expect(err).toBeInstanceOf(AbortError)
  })

  test('destroy', async () => {
    const runnable = new RunnableModule(getFixturePath('valid.js'))
    await runnable.init()

    runnable.destroy()
    const err = await getErrorAsync(() => runnable.run('echo', 'foo'))

    expect(err).toBeInstanceOf(Error)
    expect(await fs.readFile(stateFilename, 'utf-8')).toBe('destroyed')
  })

  test('clone', async () => {
    let original: RunnableModule<unknown[], unknown> | undefined
    let clone: RunnableModule<unknown[], unknown> | undefined
    try {
      original = new RunnableModule(getFixturePath('valid.js'))
      await original.init()

      clone = original.clone()
      await clone.init()
      original.destroy()
      const result = await clone.run('echo', 'foo')

      expect(clone).not.toBe(original)
      expect(result).toStrictEqual(['foo'])
    } finally {
      original?.destroy()
      clone?.destroy()
    }
  })
})
