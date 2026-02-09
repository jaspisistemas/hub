import { IsOptional, IsString, IsEnum } from 'class-validator';
import { SupportStatus } from '../entities/support.entity';

export class UpdateSupportDto {
  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;
}
