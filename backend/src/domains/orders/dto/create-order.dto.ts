import { IsString, IsNumber, IsOptional, Min, IsUUID, IsEmail, MaxLength, IsISO8601 } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  externalId!: string;

  @IsString()
  marketplace!: string;

  @IsNumber()
  @Min(0, { message: 'Total deve ser maior ou igual a 0' })
  total!: number;

  @IsOptional()
  @IsISO8601({ strict: false }, { message: 'Data do pedido deve estar em formato ISO8601' })
  orderCreatedAt?: string | Date;

  @IsOptional()
  raw?: any; // original payload from marketplace adapter

  // Dados do cliente (obrigatórios)
  @IsString()
  @MaxLength(255)
  customerName!: string;

  @IsEmail({}, { message: 'Email do cliente inválido' })
  @MaxLength(255)
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  customerState?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerZipCode?: string;

  // Relacionamento com loja
  @IsOptional()
  @IsUUID('4', { message: 'ID da loja inválido' })
  storeId?: string;
}
