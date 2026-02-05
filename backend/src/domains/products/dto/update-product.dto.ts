export class UpdateProductDto {
  name?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  category?: string;
  brand?: string;
  model?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  externalId?: string;
  marketplace?: string;
}