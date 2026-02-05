import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['created', 'processing', 'shipped', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerCity?: string;

  @IsOptional()
  @IsString()
  customerState?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  customerZipCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;
}
