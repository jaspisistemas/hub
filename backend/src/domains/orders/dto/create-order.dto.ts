export interface CreateOrderDto {
  externalId: string;
  marketplace: string;
  total: number;
  raw?: any; // original payload from marketplace adapter
}
