import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Company } from './entities/company.entity';
import { createImageUploadConfig } from '../../config/upload.config';
import { buildUploadUrl } from '../../utils/file.helpers';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // Criar empresa
  @Post()
  @UseInterceptors(FileInterceptor('logo', createImageUploadConfig('company-logos')))
  async create(
    @Body() data: Partial<Company>,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (file) {
      data.logoUrl = `/uploads/company-logos/${file.filename}`;
    }

    return this.companiesService.create(data, userId);
  }

  // Obter empresa do usuário
  @Get('my-company')
  async getMyCompany(@Request() req: any) {
    const companies = await this.companiesService.findByUser(req.user.id);
    return companies[0] || null;
  }

  // Obter detalhes da empresa
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  // Atualizar empresa
  @Put(':id')
  @UseInterceptors(FileInterceptor('logo', createImageUploadConfig('company-logos')))
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Company>,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      data.logoUrl = buildUploadUrl('COMPANY_LOGOS', file.filename);
    }

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
