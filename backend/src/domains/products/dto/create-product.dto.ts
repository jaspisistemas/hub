import { IsString, IsNumber, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name!: string;

  @IsString()
  @MinLength(2, { message: 'SKU deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'SKU deve ter no máximo 100 caracteres' })
  sku!: string;

  @IsNumber()
  @Min(0, { message: 'Preço deve ser maior ou igual a 0' })
  price!: number;

  @IsNumber()
  @Min(0, { message: 'Quantidade deve ser maior ou igual a 0' })
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  imageUrls?: string[];}