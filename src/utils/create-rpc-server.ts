import { version } from '@utils/package.js'
import * as DelightRPCExtraWebSocket from '@delight-rpc/extra-websocket'
import * as DelightRPCWebSocket from '@delight-rpc/websocket'
import { ExtraWebSocket } from 'extra-websocket'
import { ImplementationOf, AnyChannel } from 'delight-rpc'
import { IAPI } from '@src/types.js'
import { WebSocket as NodeWebSocket, WebSocketServer } from 'ws'

export function createRPCServerOnWebSocketServer(
  service: ImplementationOf<IAPI>
, wsServer: WebSocketServer
, { channel, loggerLevel = DelightRPCWebSocket.Level.None }: {
    channel?: string | RegExp | typeof AnyChannel
    loggerLevel?: DelightRPCWebSocket.Level
  } = {}
): () => void {
  wsServer.on('connection', connectionListener)

  return () => wsServer.off('connection', connectionListener)

  function connectionListener(socket: NodeWebSocket) {
    const close = createRPCServerOnWebSocket(service, socket, {
      channel
    , loggerLevel
    })

    socket.once('close', close)
  }
}

export function createRPCServerOnExtraWebSocket(
  api: ImplementationOf<IAPI>
, ws: ExtraWebSocket
, { channel, loggerLevel = DelightRPCExtraWebSocket.Level.None }: {
    channel?: string | RegExp | typeof AnyChannel
    loggerLevel?: DelightRPCExtraWebSocket.Level
  } = {}
): () => void {
  const close = DelightRPCExtraWebSocket.createServer<IAPI>(api, ws, {
    loggerLevel
  , version
  , channel
  })

  return close
}

export function createRPCServerOnWebSocket(
  service: ImplementationOf<IAPI>
, ws: NodeWebSocket
, { channel, loggerLevel = DelightRPCWebSocket.Level.None }: {
    channel?: string | RegExp | typeof AnyChannel
    loggerLevel?: DelightRPCWebSocket.Level
  } = {}
): () => void {
  const close = DelightRPCWebSocket.createServer<IAPI>(service, ws, {
    loggerLevel
  , version
  , channel
  })

  return close
}
