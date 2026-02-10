export class UpdateStoreDto {
  name?: string;
  marketplace?: string;
  status?: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
  mlAccessToken?: string;
  mlRefreshToken?: string;
  mlTokenExpiresAt?: number;
}
