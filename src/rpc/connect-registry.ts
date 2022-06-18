import { ImplementationOf } from 'delight-rpc'
import { createRPCServerOnExtraWebSocket } from '@rpc/create-rpc-server.js'
import { ExtraWebSocket, startHeartbeat, autoReconnect } from 'extra-websocket'
import { IAPI } from '@src/types.js'
import WebSocket from 'ws'
import ms from 'ms'

export async function connectRegistry(
  service: ImplementationOf<IAPI>
, registry: string
): Promise<() => Promise<void>> {
  const ws = new ExtraWebSocket(() => new WebSocket(registry))
  const cancelHeartbeat = startHeartbeat(ws, ms('30s'))
  const cancelAutoReonnect = autoReconnect(ws)
  const closeRPCServer = createRPCServerOnExtraWebSocket(service, ws)
  await ws.connect()

  return async () => {
    closeRPCServer()
    cancelHeartbeat()
    cancelAutoReonnect()
    await ws.close()
  }
}
