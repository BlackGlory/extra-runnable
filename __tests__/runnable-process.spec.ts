import { describe, test, expect, beforeEach, afterAll } from 'vitest'
import { getErrorAsync, getErrorPromise } from 'return-style'
import { RunnableProcess } from '@src/runnable-process/index.js'
import { getFixturePath } from '@test/utils.js'
import { AbortError } from 'extra-abort'
import { remove } from 'extra-filesystem'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

const stateFilename = path.join(os.tmpdir(), 'extra-runnable-test')

beforeEach(() => remove(stateFilename))
afterAll(() => remove(stateFilename))

describe('RunnableProcess', () => {
  describe('init', () => {
    test('valid', async () => {
      const runnable = new RunnableProcess(getFixturePath('valid.js'))

      try {
        await runnable.init()

        expect(await fs.readFile(stateFilename, 'utf-8')).toBe('inited')
      } finally {
        runnable.destroy()
      }
    })

    test('invalid', async () => {
      const runnable = new RunnableProcess(getFixturePath('invalid.js'))

      const err = await getErrorPromise(runnable.init())

      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('run', () => {
    test('result', async () => {
      const runnable = new RunnableProcess(getFixturePath('valid.js'))
      await runnable.init()

      try {
        const result = await runnable.run('echo', 'foo')

        expect(result).toStrictEqual(['foo'])
      } finally {
        runnable.destroy()
      }
    })

    test('error', async () => {
      const runnable = new RunnableProcess(getFixturePath('valid.js'))
      await runnable.init()

      try {
        const err = await getErrorAsync(() => runnable.run('error'))

        expect(err).toBeInstanceOf(Error)
      } finally {
        runnable.destroy()
      }
    })
  })

  test('abort', async () => {
    const runnable = new RunnableProcess(getFixturePath('valid.js'))
    await runnable.init()

    try {
      const promise = getErrorPromise(runnable.run('loop'))
      await runnable.abort()
      const err = await promise

      expect(err).toBeInstanceOf(AbortError)
    } finally {
      runnable.destroy()
    }
  })

  test('destroy', async () => {
    const runnable = new RunnableProcess(getFixturePath('valid.js'))
    await runnable.init()

    await runnable.destroy()
    const err = await getErrorAsync(() => runnable.run('echo', 'foo'))

    expect(err).toBeInstanceOf(Error)
    expect(await fs.readFile(stateFilename, 'utf-8')).toBe('destroyed')
  })

  test('clone', async () => {
    let original: RunnableProcess<unknown[], unknown> | undefined
    let clone: RunnableProcess<unknown[], unknown> | undefined
    try {
      original = new RunnableProcess(getFixturePath('valid.js'))
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
