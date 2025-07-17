import { describe, test, expect, vi } from 'vitest'
import { OrchestratorState } from '@orchestrator/index.js'
import { createOrchestrator } from '@test/utils.js'
import { pass } from '@blackglory/prelude'
import { delay } from 'extra-promise'

describe('Orchestrator', () => {
  describe('getState', () => {
    test('The state is running by default', () => {
      const orchestrator = createOrchestrator()

      const result = orchestrator.getState()

      expect(result).toBe(OrchestratorState.Running)
    })
  })

  describe('getNumberOfInstances', () => {
    test('The concurrency is 0 by default', () => {
      const orchestrator = createOrchestrator()

      const result = orchestrator.getNumberOfInstances()

      expect(result).toBe(0)
    })
  })

  describe('scale', () => {
    test('upscale', async () => {
      const initTask = vi.fn(pass)
      const runTask = vi.fn(async (signal: AbortSignal) => {
        while (!signal.aborted) {
          await delay(100)
        }
      })
      const abortTask = vi.fn(pass)
      const destroyTask = vi.fn(pass)
      const orchestrator = createOrchestrator({
        initTask
      , runTask
      , abortTask
      , destroyTask
      })

      try {
        const promise = orchestrator.scale(5)
        const state1 = orchestrator.getState()
        await promise
        const state2 = orchestrator.getState()

        expect(state1).toBe(OrchestratorState.Scaling)
        expect(state2).toBe(OrchestratorState.Running)
        expect(orchestrator.getNumberOfInstances()).toBe(5)
        expect(initTask).toBeCalledTimes(5)
        expect(runTask).toBeCalledTimes(5)
        expect(abortTask).not.toBeCalled()
        expect(destroyTask).not.toBeCalled()
      } finally {
        await orchestrator.terminate()
      }
    })

    test('downscale', async () => {
      const initTask = vi.fn(pass)
      const runTask = vi.fn(async signal => {
        while (!signal.aborted) {
          await delay(100)
        }
      })
      const abortTask = vi.fn(pass)
      const destroyTask = vi.fn(pass)
      const orchestrator = createOrchestrator({
        initTask
      , runTask
      , abortTask
      , destroyTask
      })

      try {
        await orchestrator.scale(5)

        const promise = orchestrator.scale(0)
        const state1 = orchestrator.getState()
        await promise
        const state2 = orchestrator.getState()

        expect(state1).toBe(OrchestratorState.Scaling)
        expect(state2).toBe(OrchestratorState.Running)
        expect(orchestrator.getNumberOfInstances()).toBe(0)
        expect(initTask).toBeCalledTimes(5)
        expect(runTask).toBeCalledTimes(5)
        expect(abortTask).toBeCalledTimes(5)
        expect(destroyTask).toBeCalledTimes(5)
      } finally {
        await orchestrator.terminate()
      }
    })
  })

  describe('event', () => {
    test('error', async () => {
      const customError = new Error('custom error')
      const initTask = vi.fn(pass)
      const runTask = vi.fn(() => {
        throw customError
      })
      const abortTask = vi.fn(pass)
      const destroyTask = vi.fn(pass)
      const orchestrator = createOrchestrator({
        initTask
      , runTask
      , abortTask
      , destroyTask
      })
      const errorListener = vi.fn()

      try {
        orchestrator.on('error', errorListener)
        await orchestrator.scale(2)

        expect(errorListener).toBeCalledTimes(2)
        expect(errorListener).nthCalledWith(1, customError)
        expect(errorListener).nthCalledWith(2, customError)
      } finally {
        await orchestrator.terminate()
      }
    })

    test('terminated', async () => {
      const orchestrator = createOrchestrator()
      const terminatedListener = vi.fn()

      orchestrator.on('terminated', terminatedListener)
      await orchestrator.terminate()

      expect(terminatedListener).toBeCalledTimes(1)
    })
  })
})
