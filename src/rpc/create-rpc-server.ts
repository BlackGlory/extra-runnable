import { version } from '@utils/package.js'
import * as DelightRPCExtraWebSocket from '@delight-rpc/extra-websocket'
import * as DelightRPCWebSocket from '@delight-rpc/websocket'
import { IAPI } from '@src/types.js'
import { ExtraWebSocket } from 'extra-websocket'
import { ImplementationOf } from 'delight-rpc'
import { WebSocket } from 'ws'

export function createRPCServerOnExtraWebSocket(
  api: ImplementationOf<IAPI>
, ws: ExtraWebSocket
): () => void {
  return DelightRPCExtraWebSocket.createServer<IAPI>(api, ws, {
    loggerLevel: DelightRPCExtraWebSocket.Level.None
  , version
  , ownPropsOnly: true
  })
}

export function createRPCServerOnWebSocket(
  api: ImplementationOf<IAPI>
, ws: WebSocket
): () => void {
  return DelightRPCWebSocket.createServer<IAPI>(api, ws, {
    loggerLevel: DelightRPCWebSocket.Level.None
  , version
  , ownPropsOnly: true
  })
}
