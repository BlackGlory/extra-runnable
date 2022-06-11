import { ImplementationOf } from 'delight-rpc'
import { IAPI } from '@src/types.js'
import { createRPCServerOnWebSocket } from './create-rpc-server.js'
import ws from 'ws'

export function startRPCServer(
  api: ImplementationOf<IAPI>
, port: number
): ws.Server {
  const server = new ws.Server({ port })
  server.on('connection', socket => {
    const close = createRPCServerOnWebSocket(api, socket)

    socket.once('close', () => close())
  })

  return server
}
