import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateInvoiceDto {
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

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsBoolean()
  @IsOptional()
  sentToMarketplace?: boolean;

  @IsDateString()
  @IsOptional()
  sentAt?: string;
}
