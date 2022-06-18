import { IAPI } from '@src/types.js'
import { Service } from '@rpc/service.js'
import { WebSocketServer } from 'ws'
import { connectRegistry } from '@rpc/connect-registry.js'
import { createOrchestrator } from '@test/utils.js'
import { ImplementationOf, ClientProxy } from 'delight-rpc'
import * as DelightRPCWebSocket from '@delight-rpc/websocket'
import { OrchestratorState } from '@orchestrator/index.js'
import { waitForEventEmitter } from '@blackglory/wait-for'
import { WebSocket } from 'ws'
import { promisify } from 'extra-promise'
import ms from 'ms'

describe('Service', () => {
  test('getId', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService({ id: 'test-id' })
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      const id = await client.getId()

      expect(id).toBe('test-id')
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })

  test('getLabel', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService({ label: 'test-label' })
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      const label = await client.getLabel()

      expect(label).toBe('test-label')
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })

  test('setLabel', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService({ label: 'test-label' })
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      await client.setLabel('new-label')
      const label = await client.getLabel()

      expect(label).toBe('new-label')
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })

  test('getState', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService()
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      const state = await client.getState()

      expect(state).toBe(OrchestratorState.Running)
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })

  test('getConcurrency', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService()
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      const concurrency = await client.getConcurrency()

      expect(concurrency).toBe(0)
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })

  test('scale', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService()
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      await client.scale(1)
      const concurrency = await client.getConcurrency()

      expect(concurrency).toBe(1)
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await api.terminate()
      await closeRegistryServer(registryServer)
    }
  })

  test('terminate', async () => {
    const registryServer = startRegistryServer()
    const promise = waitForClient(registryServer)
    const api = createService()
    const disconnectRegistryServer = await connectRegistryServer(api)
    const [client, closeClient] = await promise

    try {
      await client.terminate()
    } finally {
      closeClient()
      await disconnectRegistryServer()
      await closeRegistryServer(registryServer)
    }
  })
})

function createService(
  {
    id = ''
  , label = ''
  }: {
    id?: string
    label?: string
  } = {}
): ImplementationOf<IAPI> {
  const orchestrator = createOrchestrator()
  const api = new Service(orchestrator, { id, label })
  return api
}

async function connectRegistryServer(
  api: ImplementationOf<IAPI>
): Promise<() => Promise<void>> {
  const disconnect = await connectRegistry(api, 'ws://localhost:8080')
  return disconnect
}

function startRegistryServer(): WebSocketServer {
  const server = new WebSocketServer({ port: 8080 })

  return server
}

async function waitForClient(
  server: WebSocketServer
): Promise<[ClientProxy<IAPI>, () => void]> {
  const [socket] = await waitForEventEmitter(server, 'connection') as [WebSocket]
  const [client, closeClient] = DelightRPCWebSocket.createClient<IAPI>(socket, {
    timeout: ms('30s')
  })

  return [
    client
  , () => {
      closeClient()
      socket.close()
    }
  ]
}

async function closeRegistryServer(server: WebSocketServer): Promise<void> {
  await promisify(server.close).bind(server)()
}
