export interface CreateOrderDto {
  externalId: string;
  marketplace: string;
  total: number;
  raw?: any;
}

export interface OrderCreatedEvent {
  orderId: string;
  marketplace: string;
  occurredAt: Date;
}

export interface OrderIntegrationFailedEvent {
  orderId: string;
  reason: string;
}

export interface Order {
  id: string;
  externalId: string;
  marketplace: string;
  status: string;
  total: number;
  raw?: any;
  createdAt: string;
  updatedAt: string;
}
