import { IsOptional, IsIn, IsBoolean, IsNumber } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: string;

  @IsOptional()
  @IsIn(['pt-BR', 'en-US', 'es-ES'])
  language?: string;

  @IsOptional()
  @IsIn(['BRL', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsSystem?: boolean;

  @IsOptional()
  @IsNumber()
  defaultDashboardPeriod?: number;
}
