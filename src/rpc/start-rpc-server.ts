import { ImplementationOf } from 'delight-rpc'
import { IAPI } from '@src/types.js'
import { createRPCServerOnWebSocket } from './create-rpc-server.js'
import { WebSocketServer } from 'ws'

export function startRPCServer(
  service: ImplementationOf<IAPI>
, port: number
): WebSocketServer {
  const server = new WebSocketServer({ port })
  server.on('connection', socket => {
    const close = createRPCServerOnWebSocket(service, socket)

    socket.once('close', () => close())
  })

  return server
}
