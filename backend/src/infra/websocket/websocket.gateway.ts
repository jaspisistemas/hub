import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // Orders events
  emitOrderCreated(payload: any) {
    this.logger.debug('Emitindo evento: order.created', payload);
    this.server.emit('order.created', payload);
  }

  emitOrderUpdated(payload: any) {
    this.logger.debug('Emitindo evento: order.updated', payload);
    this.server.emit('order.updated', payload);
  }

  emitOrderDeleted(payload: any) {
    this.logger.debug('Emitindo evento: order.deleted', payload);
    this.server.emit('order.deleted', payload);
  }

  // Products events
  emitProductCreated(payload: any) {
    this.logger.debug('Emitindo evento: product.created', payload);
    this.server.emit('product.created', payload);
  }

  emitProductUpdated(payload: any) {
    this.logger.debug('Emitindo evento: product.updated', payload);
    this.server.emit('product.updated', payload);
  }

  emitProductDeleted(payload: any) {
    this.logger.debug('Emitindo evento: product.deleted', payload);
    this.server.emit('product.deleted', payload);
  }
}
