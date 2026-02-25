import { describe, test, expect, beforeEach, afterAll } from 'vitest'
import { getErrorAsync, getErrorPromise } from 'return-style'
import { RunnableThread } from '@src/runnable-thread/index.js'
import { getFixturePath } from '@test/utils.js'
import { AbortError } from 'extra-abort'
import { remove } from 'extra-filesystem'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

const stateFilename = path.join(os.tmpdir(), 'extra-runnable-test')

beforeEach(() => remove(stateFilename))
afterAll(() => remove(stateFilename))

describe('RunnableThread', () => {
  describe('init', () => {
    test('valid', async () => {
      const runnable = new RunnableThread(getFixturePath('valid.js'))

      try {
        await runnable.init()

        expect(await fs.readFile(stateFilename, 'utf-8')).toBe('inited')
      } finally {
        await runnable.destroy()
      }
    })

    test('invalid', async () => {
      const runnable = new RunnableThread(getFixturePath('invalid.js'))

      const err = await getErrorPromise(runnable.init())

      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('run', () => {
    test('result', async () => {
      const runnable = new RunnableThread(getFixturePath('valid.js'))
      await runnable.init()

      try {
        const result = await runnable.run('echo', 'foo')

        expect(result).toStrictEqual(['foo'])
      } finally {
        await runnable.destroy()
      }
    })

    test('error', async () => {
      const runnable = new RunnableThread(getFixturePath('valid.js'))
      await runnable.init()

      try {
        const err = await getErrorAsync(() => runnable.run('error'))

        expect(err).toBeInstanceOf(Error)
      } finally {
        await runnable.destroy()
      }
    })
  })

  test('abort', async () => {
    const runnable = new RunnableThread(getFixturePath('valid.js'))
    await runnable.init()

    try {
      const promise = getErrorPromise(runnable.run('loop'))
      await runnable.abort()
      const err = await promise

      expect(err).toBeInstanceOf(AbortError)
    } finally {
      await runnable.destroy()
    }
  })

  test('destroy', async () => {
    const runnable = new RunnableThread(getFixturePath('valid.js'))
    await runnable.init()

    await runnable.destroy()
    const err = await getErrorAsync(() => runnable.run('echo', 'foo'))

    expect(err).toBeInstanceOf(Error)
    expect(await fs.readFile(stateFilename, 'utf-8')).toBe('destroyed')
  })

  test('clone', async () => {
    let original: RunnableThread<unknown[], unknown> | undefined
    let clone: RunnableThread<unknown[], unknown> | undefined
    try {
      original = new RunnableThread(getFixturePath('valid.js'))
      await original.init()

      clone = original.clone()
      await clone.init()
      await original.destroy()
      const result = await clone.run('echo', 'foo')

      expect(clone).not.toBe(original)
      expect(result).toStrictEqual(['foo'])
    } finally {
      await original?.destroy()
      await clone?.destroy()
    }
  })
})
