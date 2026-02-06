import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderCreatedEvent, OrderIntegrationFailedEvent } from './events';
import { Order } from './entities/order.entity';
import { WebsocketGateway } from '../../infra/websocket/websocket.gateway';

/**
 * OrdersService: contém APENAS regras de negócio.
 * - NÃO conhece APIs externas ou adapters.
 * - Publica eventos para outros subsistemas.
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // exemplo de regra de negócio: garantir total >= 0
    if (dto.total < 0) {
      const err: OrderIntegrationFailedEvent = {
        orderId: 'unknown',
        reason: 'Invalid total',
      };
      // emitir evento para fila ou barramento de eventos (simulado)
      this.handleIntegrationFailure(err);
      throw new Error('Invalid order total');
    }

    const order = this.ordersRepository.create({
      externalId: dto.externalId,
      marketplace: dto.marketplace,
      status: 'created',
      total: dto.total,
      rawData: dto.raw ? JSON.stringify(dto.raw) : undefined,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerCity: dto.customerCity,
      customerState: dto.customerState,
      customerAddress: dto.customerAddress,
      customerZipCode: dto.customerZipCode,
    });

    const saved = await this.ordersRepository.save(order);

    const createdEvent: OrderCreatedEvent = {
      orderId: saved.id,
      marketplace: saved.marketplace,
      occurredAt: new Date(),
    };

    // emitir o evento (simulado) - em app real usar EventEmitter/BullMQ
    this.emitOrderCreated(createdEvent);

    return saved;
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async listOrders() {
    return this.ordersRepository.find();
  }

  async listOrdersByUser(userId: string) {
    return this.ordersRepository
      .createQueryBuilder('order')
      .leftJoin('order.store', 'store')
      .where('store.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    const order = await this.getOrderById(id);
    
    const updated = Object.assign(order, {
      status: dto.status || order.status,
      customerName: dto.customerName || order.customerName,
      customerEmail: dto.customerEmail || order.customerEmail,
      customerPhone: dto.customerPhone || order.customerPhone,
      customerCity: dto.customerCity || order.customerCity,
      customerState: dto.customerState || order.customerState,
      customerAddress: dto.customerAddress || order.customerAddress,
      customerZipCode: dto.customerZipCode || order.customerZipCode,
      total: dto.total !== undefined ? dto.total : order.total,
    });

    const saved = await this.ordersRepository.save(updated);

    // Emitir evento de atualização
    this.websocketGateway.emitOrderUpdated({
      id: saved.id,
      status: saved.status,
    });

    return saved;
  }

  private emitOrderCreated(event: OrderCreatedEvent) {
    // Emitir via WebSocket para clientes conectados
    this.websocketGateway.emitOrderCreated(event);
    console.log('[event] order.created', event);
  }

  private handleIntegrationFailure(event: OrderIntegrationFailedEvent) {
    console.warn('[event] order.integration_failed', event);
  }
}
