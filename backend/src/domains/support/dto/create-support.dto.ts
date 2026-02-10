import { IsEnum, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { SupportOrigin, SupportType, SupportStatus } from '../entities/support.entity';

export class CreateSupportDto {
  @IsEnum(SupportOrigin)
  origin!: SupportOrigin;

  @IsEnum(SupportType)
  type!: SupportType;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  productExternalId?: string;

  @IsOptional()
  @IsString()
  productTitle?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerExternalId?: string;

  @IsString()
  question!: string;

  @IsOptional()
  @IsDateString()
  questionDate?: Date;

  @IsOptional()
  @IsBoolean()
  canAnswer?: boolean;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}
