import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { multerConfig } from '../../config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  create(
    @Request() req: any,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      dto.imageUrls = files.map(file => `/uploads/${file.filename}`);
    }
    
    // Processar mlAttributes se chegou como string ou array estranho
    if (typeof dto.mlAttributes === 'string') {
      console.log('🔄 Parseando mlAttributes string...');
      try {
        dto.mlAttributes = JSON.parse(dto.mlAttributes);
        console.log('✅ mlAttributes parseado:', dto.mlAttributes);
      } catch (error) {
        console.warn('❌ Erro ao parsear mlAttributes:', error);
      }
    } else if (typeof dto.mlAttributes === 'object' && dto.mlAttributes !== null) {
      // Se é um objeto, verificar se tem índices numéricos (foi parseado errado)
      const keys = Object.keys(dto.mlAttributes);
      const hasNumericKeys = keys.some(k => !isNaN(Number(k)));
      
      if (hasNumericKeys && keys.some(k => isNaN(Number(k)))) {
        // Tem ambos indices numéricos e named properties
        // Isso significa que foi parseado errado como array
        console.warn('⚠️ mlAttributes foi parseado errado como array');
        // Extrair apenas as propriedades named (não numéricas)
        const cleanedAttrs: Record<string, any> = {};
        keys.forEach(k => {
          if (isNaN(Number(k))) {
            cleanedAttrs[k] = dto.mlAttributes[k];
          }
        });
        dto.mlAttributes = cleanedAttrs;
        console.log('✅ mlAttributes limpo:', dto.mlAttributes);
      }
    }
    
    return this.productsService.create(dto, req.user.id, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    // Se usuário tem company, retorna produtos da empresa
    if (req.user.companyId) {
      return this.productsService.findAllByCompany(req.user.companyId);
    }
    // Senão retorna produtos do usuário
    return this.productsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    if (files && files.length > 0) {
      dto.imageUrls = files.map(file => `/uploads/${file.filename}`);
    }
    
    // Processar mlAttributes se chegou como string ou array estranho
    if (typeof dto.mlAttributes === 'string') {
      try {
        dto.mlAttributes = JSON.parse(dto.mlAttributes);
      } catch (error) {
        console.warn('Aviso: mlAttributes não é um JSON válido');
      }
    } else if (typeof dto.mlAttributes === 'object' && dto.mlAttributes !== null) {
      // Se é um objeto, verificar se tem índices numéricos (foi parseado errado)
      const keys = Object.keys(dto.mlAttributes);
      const hasNumericKeys = keys.some(k => !isNaN(Number(k)));
      
      if (hasNumericKeys && keys.some(k => isNaN(Number(k)))) {
        // Extrair apenas as propriedades named (não numéricas)
        const cleanedAttrs: Record<string, any> = {};
        keys.forEach(k => {
          if (isNaN(Number(k))) {
            cleanedAttrs[k] = dto.mlAttributes[k];
          }
        });
        dto.mlAttributes = cleanedAttrs;
      }
    }
    
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('export')
  async exportToMarketplace(@Body() dto: { productIds: string[]; marketplace: string }) {
    // Aqui você pode adicionar lógica para integrar com APIs dos marketplaces
    // Por enquanto, vamos simular o sucesso da exportação
    const { productIds, marketplace } = dto;
    
    console.log(`Exportando ${productIds.length} produtos para ${marketplace}`);
    
    // Buscar os produtos
    const products = await Promise.all(
      productIds.map(id => this.productsService.findOne(id))
    );
    
    // TODO: Implementar integração real com APIs dos marketplaces
    // Exemplo: chamar API do Mercado Livre, Shopee, etc.
    
    return {
      success: true,
      message: `${productIds.length} produto(s) exportado(s) para ${marketplace}`,
      products: products.map(p => ({ id: p.id, name: p.name, sku: p.sku })),
      marketplace,
    };
  }
}
