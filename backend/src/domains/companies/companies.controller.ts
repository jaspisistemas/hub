import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Company } from './entities/company.entity';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // Criar empresa
  @Post()
  async create(@Body() data: Partial<Company>, @Request() req) {
    return this.companiesService.create(data, req.user.sub);
  }

  // Obter empresa do usuário
  @Get('my-company')
  async getMyCompany(@Request() req) {
    const companies = await this.companiesService.findByUser(req.user.sub);
    return companies[0] || null;
  }

  // Obter detalhes da empresa
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  // Atualizar empresa
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Company>) {
    return this.companiesService.update(id, data);
  }

  // Deletar empresa
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.companiesService.delete(id);
  }

  // ========== COLABORADORES ==========

  // Adicionar colaborador (enviar convite)
  @Post(':companyId/members')
  async addMember(
    @Param('companyId') companyId: string,
    @Body() body: { email: string; role: string },
  ) {
    return this.companiesService.addMember(companyId, body.email, body.role);
  }

  // Listar colaboradores
  @Get(':companyId/members')
  async getMembers(@Param('companyId') companyId: string) {
    return this.companiesService.getMembers(companyId);
  }

  // Aceitar convite
  @Post('invite/:token')
  async acceptInvite(@Param('token') token: string) {
    return this.companiesService.acceptInvite(token);
  }

  // Alterar role do colaborador
  @Put('members/:memberId/role')
  async updateMemberRole(
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.companiesService.updateMemberRole(memberId, body.role);
  }

  // Remover colaborador
  @Delete('members/:memberId')
  async removeMember(@Param('memberId') memberId: string) {
    return this.companiesService.removeMember(memberId);
  }
}
