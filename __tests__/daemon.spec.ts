import { ThreadTaskFactory } from '@src/tasks/thread/index.js'
import { Daemon } from '@src/daemon.js'
import { getFixturePath } from '@test/utils.js'
import { DaemonStatus, IMetaModule, Reason } from '@src/types'
import { waitForFunction, waitForTimeout } from '@blackglory/wait-for'
import { Observable } from 'rxjs'
import { delay } from 'extra-promise'
import { go } from '@blackglory/go'
import { jest } from '@jest/globals'

const exitProcess = jest.fn()
afterEach(() => exitProcess.mockClear())

describe('Daemon', () => {
  test('default is idle', () => {
    const daemon = createDaemon()

    expect(daemon.getStatus()).toBe(DaemonStatus.Idle)
  })

  describe('init', () => {
    test('emit first value', async () => {
      const daemon = createDaemon({
        metaModule: {
          init() {
            return new Observable(observer => {
              go(async () => {
                await delay(100)
                observer.next('value')
              })
            })
          }
        }
      })

      const result = await daemon.getParamsValue()

      expect(result).toBe('value')
    })

    test('emit non-first value', async () => {
      const daemon = createDaemon({
        metaModule: {
          init() {
            return new Observable(observer => {
              go(async () => {
                await delay(100)
                observer.next('value-1')
                await delay(100)
                observer.next('value-2')
              })
            })
          }
        }
      })

      await waitForFunction(async () => {
        return await daemon.getParamsValue() === 'value-2'
      })
    })

    describe('emit completed', () => {
      test('before first value', async () => {
        const final = jest.fn<any, any>()
        const daemon = createDaemon({
          metaModule: {
            init() {
              return new Observable(observer => {
                go(async () => {
                  await delay(100)
                  observer.complete()
                })
              })
            }
          , final
          }
        })

        await waitForTimeout(1000)
        expect(daemon.getStatus()).toBe(DaemonStatus.Exiting)

        expect(final).toBeCalledWith(Reason.Error, expect.any(Error))
        expect(exitProcess).toBeCalledWith(expect.any(Error))
      })

      test('after first value', async () => {
        const daemon = createDaemon({
          metaModule: {
            init() {
              return new Observable(observer => {
                go(async () => {
                  await delay(100)
                  observer.next('value')
                  observer.complete()
                })
              })
            }
          }
        })

        const result = await daemon.getParamsValue()

        expect(result).toBe('value')
        expect(daemon.getStatus()).not.toBe(DaemonStatus.Exiting)
      })
    })

    describe('emit error', () => {
      it('should be crash because error', async () => {
        const error = new Error('custom error')
        const final = jest.fn<any, any>()
        const daemon = createDaemon({
          metaModule: {
            init() {
              return new Observable(observer => {
                go(async () => {
                  await delay(100)
                  observer.error(error)
                })
              })
            }
          , final
          }
        })

        await waitForTimeout(1000)
        expect(daemon.getStatus()).toBe(DaemonStatus.Exiting)

        expect(final).toBeCalledWith(Reason.Error, error)
        expect(exitProcess).toBeCalledWith(error)
      })
    })
  })

  describe('concurrency', () => {
    test('init', () => {
      const daemon = createDaemon()

      expect(daemon.getStatus()).toBe(DaemonStatus.Idle)
      expect(daemon.getConcurrency()).toStrictEqual({
        current: 0
      , target: 0
      })
    })

    test('upscale', async () => {
      const target = 5
      const daemon = createDaemon()

      try {
        daemon.setConcurrency(target)
        expect(daemon.getStatus()).toBe(DaemonStatus.Scaling)
        await waitForFunction(() => daemon.getConcurrency().current === target)
        expect(daemon.getStatus()).toBe(DaemonStatus.Running)

        expect(daemon.getConcurrency()).toStrictEqual({
          current: target
        , target
        })
      } finally {
        daemon.setConcurrency(0)
      }
    })

    test('downscale', async () => {
      const init = 10
      const target = 5
      const daemon = createDaemon()

      try {
        daemon.setConcurrency(init)
        expect(daemon.getStatus()).toBe(DaemonStatus.Scaling)
        await waitForFunction(() => daemon.getConcurrency().current === init)
        expect(daemon.getStatus()).toBe(DaemonStatus.Running)

        daemon.setConcurrency(target)
        expect(daemon.getStatus()).toBe(DaemonStatus.Scaling)
        await waitForFunction(async () => daemon.getConcurrency().current === target)
        expect(daemon.getStatus()).toBe(DaemonStatus.Running)

        expect(daemon.getConcurrency()).toStrictEqual({
          current: target
        , target
        })
      } finally {
        daemon.setConcurrency(0)
      }
    })
  })

  test('getInfo()', () => {
    const daemon = createDaemon()

    const result = daemon.getInfo()

    expect(result).toStrictEqual({
      id: 'test-id'
    , label: 'test-label'
    , mode: 'thread'
    })
  })

  test('exit()', async () => {
    const final = jest.fn<any, any>()
    const daemon = createDaemon({
      metaModule: { final }
    })

    daemon.exit()
    expect(daemon.getStatus()).toBe(DaemonStatus.Exiting)
    await waitForTimeout(1000)

    expect(final).toBeCalledWith(Reason.Exit)
    expect(exitProcess).toBeCalled()
  })

  test('ping()', () => {
    const daemon = createDaemon()

    const result = daemon.ping()

    expect(result).toBe('pong')
  })
})

function createDaemon(params?: {
  metaModule?: IMetaModule<unknown>
  taskFilename?: string
}) {
  const taskFilename = params?.taskFilename ?? getFixturePath('esm/stopable.js')

  return new TestDaemon({
    id: 'test-id'
  , label: 'test-label'
  , taskFactory: new ThreadTaskFactory(taskFilename)
  , metaModule: params?.metaModule ?? {}
  , _exitProcess: exitProcess
  })
}

class TestDaemon extends Daemon {
  async getParamsValue(): Promise<unknown> {
    return await this.params
  }
}
