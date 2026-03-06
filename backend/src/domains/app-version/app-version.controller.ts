import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppVersionService } from './app-version.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('versao-sistema')
  @Public()
  async getVersaoSistema() {
    const version = await this.appVersionService.getCurrentVersion();
    return { version };
  }

  @Get('status-atualizacao')
  @Public()
  async getStatusAtualizacao() {
    return this.appVersionService.getStatusAtualizacao();
  }

  @Get('versao-nova-status')
  @UseGuards(JwtAuthGuard)
  async getVersaoNovaStatus(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.appVersionService.getVersaoNovaStatus(userId);
  }

  @Post('buscar-atualizacoes')
  @UseGuards(JwtAuthGuard)
  async buscarAtualizacoes(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.appVersionService.buscarAtualizacoes(userId);
  }

  @Post('executar-atualizacao')
  @UseGuards(JwtAuthGuard)
  async executarAtualizacao(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.appVersionService.executarAtualizacao(userId);
  }
}
