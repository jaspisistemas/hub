import { IsString, IsNumber, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'SKU deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'SKU deve ter no máximo 100 caracteres' })
  sku?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0, { message: 'Preço deve ser maior ou igual a 0' })
  price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade deve ser maior ou igual a 0' })
  quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  marketplace?: string;

  @IsOptional()
  @IsString()
  mlCategoryId?: string;

  @IsOptional()
  mlAttributes?: any;
}