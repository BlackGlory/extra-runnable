import { describe, test, expect } from 'vitest'
import { IAPI } from '@src/types.js'
import { API } from '@src/api.js'
import { createRPCServerOnWebSocketServer } from '@utils/create-rpc-server.js'
import * as DelightRPCExtraWebSocket from '@delight-rpc/extra-websocket'
import { ExtraWebSocket } from 'extra-websocket'
import { WebSocket, WebSocketServer } from 'ws'
import { promisify } from 'extra-promise'
import { createOrchestrator } from '@test/utils.js'
import { OrchestratorState } from '@orchestrator/index.js'
import ms from 'ms'

describe('API', () => {
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
  const service = new API(orchestrator, { id, label })
  const wsServer = new WebSocketServer({ port: 8080 })
  const closeRPCServer = createRPCServerOnWebSocketServer(service, wsServer)
  const closeServer = promisify<void>(wsServer.close).bind(wsServer)

  return async () => {
    closeRPCServer()
    await closeServer()
    if (
      orchestrator.getState() !== OrchestratorState.Terminating &&
      orchestrator.getState() !== OrchestratorState.Terminated
    ) {
      await orchestrator.terminate()
    }
  }
}
