import { Controller, Post, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesInviteController {
  constructor(private companiesService: CompaniesService) {}

  // Aceitar convite (rota publica)
  @Post('invite/:token')
  async acceptInvite(@Param('token') token: string) {
    return this.companiesService.acceptInvite(token);
  }
}
