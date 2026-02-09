import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateStoreDto) {
    dto.userId = req.user.id;
    return this.storesService.create(dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.storesService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const store = await this.storesService.findOne(id);
    if (store.userId !== req.user.id) {
      throw new Error('Acesso negado');
    }
    return store;
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateStoreDto) {
    const store = await this.storesService.findOne(id);
    if (store.userId !== req.user.id) {
      throw new Error('Acesso negado');
    }
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const store = await this.storesService.findOne(id);
    if (store.userId !== req.user.id) {
      throw new Error('Acesso negado');
    }
    return this.storesService.remove(id);
  }

  /**
   * Desconectar uma loja do Mercado Livre
   */
  @Post(':id/disconnect')
  async disconnectMercadoLivre(@Request() req: any, @Param('id') id: string) {
    const store = await this.storesService.findOne(id);
    if (store.userId !== req.user.id) {
      throw new Error('Acesso negado');
    }
    return this.storesService.disconnectMercadoLiveStore(id, req.user.id);
  }

  /**
   * Listar todas as lojas Mercado Livre conectadas do usuário
   */
  @Get('marketplace/mercadolivre')
  findAllMercadoLivre(@Request() req: any) {
    return this.storesService.findAllMercadoLivreStores(req.user.id);
  }
}
