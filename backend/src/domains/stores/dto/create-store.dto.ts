export class CreateStoreDto {
  name!: string;
  marketplace!: string;
  status?: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
  userId?: string;
  companyId?: string;
}
