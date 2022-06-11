import { ImplementationOf } from 'delight-rpc'
import { createRPCServerOnExtraWebSocket } from '@rpc/create-rpc-server.js'
import { ExtraWebSocket, startHeartbeat, autoReconnect } from 'extra-websocket'
import { IAPI } from '@src/types.js'
import WebSocket from 'ws'
import ms from 'ms'

export function connectRegistry(
  api: ImplementationOf<IAPI>
, registry: string
): () => Promise<void> {
  const ws = new ExtraWebSocket(() => new WebSocket(registry))
  const cancelHeartbeat = startHeartbeat(ws, ms('30s'))
  const cancelAutoReonnect = autoReconnect(ws)
  const closeRPCServer = createRPCServerOnExtraWebSocket(api, ws)

  return async () => {
    closeRPCServer()
    cancelHeartbeat()
    cancelAutoReonnect()
    await ws.close()
  }
}
