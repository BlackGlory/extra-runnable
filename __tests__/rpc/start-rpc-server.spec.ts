import { IAPI } from '@src/types.js'
import { Service } from '@rpc/service.js'
import { startRPCServer } from '@rpc/start-rpc-server.js'
import { ExtraWebSocket } from 'extra-websocket'
import { WebSocket } from 'ws'
import { promisify } from 'extra-promise'
import { createOrchestrator } from '@test/utils.js'
import { OrchestratorState } from '@orchestrator/index.js'
import * as DelightRPCExtraWebSocket from '@delight-rpc/extra-websocket'
import ms from 'ms'

describe('Service', () => {
  test('getId', async () => {
    const closeServer = startServer({ id: 'test-id' })
    const [client, closeClient] = await createClient()

    try {
      const id = await client.getId()

      expect(id).toBe('test-id')
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('getLabel', async () => {
    const closeServer = startServer({ label: 'test-label' })
    const [client, closeClient] = await createClient()

    try {
      const label = await client.getLabel()

      expect(label).toBe('test-label')
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('setLabel', async () => {
    const closeServer = startServer({ label: 'test-label' })
    const [client, closeClient] = await createClient()

    try {
      await client.setLabel('new-label')
      const label = await client.getLabel()

      expect(label).toBe('new-label')
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('getState', async () => {
    const closeServer = startServer()
    const [client, closeClient] = await createClient()

    try {
      const state = await client.getState()

      expect(state).toBe(OrchestratorState.Running)
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('getConcurrency', async () => {
    const closeServer = startServer()
    const [client, closeClient] = await createClient()

    try {
      const concurrency = await client.getConcurrency()

      expect(concurrency).toBe(0)
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('scale', async () => {
    const closeServer = startServer()
    const [client, closeClient] = await createClient()

    try {
      await client.scale(1)
      const concurrency = await client.getConcurrency()

      expect(concurrency).toBe(1)
    } finally {
      await closeClient()
      await closeServer()
    }
  })

  test('terminate', async () => {
    const closeServer = startServer()
    const [client, closeClient] = await createClient()

    try {
      await client.terminate()
    } finally {
      await closeClient()
      await closeServer()
    }
  })
})

async function createClient() {
  const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
  await ws.connect()

  const [client, closeClient] = DelightRPCExtraWebSocket.createClient<IAPI>(ws, {
    timeout: ms('30s')
  })
  return [
    client
  , async () => {
      closeClient()
      await ws.close()
    }
  ] as const
}

function startServer(
  {
    id = ''
  , label = ''
  }: {
    id?: string
    label?: string
  } = {}
): () => Promise<void> {
  const orchestrator = createOrchestrator()
  const service = new Service(orchestrator, { id, label })
  const server = startRPCServer(service, 8080)
  const closeServer = promisify<void>(server.close).bind(server)
  return async () => {
    await closeServer()
    if (
      orchestrator.getState() !== OrchestratorState.Terminating &&
      orchestrator.getState() !== OrchestratorState.Terminated
    ) {
      await orchestrator.terminate()
    }
  }
}
