import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Company } from './entities/company.entity';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/company-logos',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `logo-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new Error('Apenas imagens são permitidas!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // Criar empresa
  @Post()
  @UseInterceptors(FileInterceptor('logo', multerOptions))
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
  @UseInterceptors(FileInterceptor('logo', multerOptions))
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Company>,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      data.logoUrl = `/uploads/company-logos/${file.filename}`;
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
