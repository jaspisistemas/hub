import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { SupportOrigin, SupportType, SupportStatus } from '../entities/support.entity';

export class FilterSupportDto {
  @IsOptional()
  @IsEnum(SupportOrigin)
  origin?: SupportOrigin;

  @IsOptional()
  @IsEnum(SupportType)
  type?: SupportType;

  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  daysRange?: number; // Número de dias para filtrar
}
