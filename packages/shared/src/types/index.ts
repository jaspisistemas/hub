/**
 * Tipos e interfaces compartilhadas
 */

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

export interface StatusLabel {
  label: string;
  color: string;
}

export interface MarketplaceBadge {
  label: string;
  text: string;
  bg: string;
  color: string;
}
