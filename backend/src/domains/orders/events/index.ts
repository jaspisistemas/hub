export interface OrderCreatedEvent {
  orderId: string;
  marketplace: string;
  occurredAt: Date;
}

export interface OrderIntegrationFailedEvent {
  orderId: string;
  reason: string;
}
