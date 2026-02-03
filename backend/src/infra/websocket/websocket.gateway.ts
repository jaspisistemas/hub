import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway()
export class WebsocketGateway {
  @WebSocketServer()
  server!: any;

  emitOrderCreated(payload: any) {
    this.server.emit('order.created', payload);
  }
}
