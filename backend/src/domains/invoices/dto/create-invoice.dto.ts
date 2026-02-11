import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  orderId!: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  series?: string;

  @IsString()
  @IsOptional()
  accessKey?: string;

  @IsString()
  @IsOptional()
  xmlContent?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;
}
