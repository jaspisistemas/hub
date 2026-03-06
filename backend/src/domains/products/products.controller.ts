import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { multerConfig } from '../../config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { isValidUUID } from '@hub/shared';
import { parseMlAttributes } from '../../utils/ml-attributes.helper';
import { buildUploadUrl } from '../../utils/file.helpers';

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
      dto.imageUrls = files.map(file => buildUploadUrl('PRODUCTS', file.filename));
    }
    
    // Processar mlAttributes usando helper centralizado
    if (dto.mlAttributes) {
      const parsed = parseMlAttributes(dto.mlAttributes);
      dto.mlAttributes = parsed || dto.mlAttributes;
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

  @Public()
  @Get('info-page')
  async getInfoPage() {
    return this.productsService.getInfoPage();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Validar formato UUID usando helper centralizado
    if (!isValidUUID(id)) {
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
    // Validar formato UUID usando helper centralizado
    if (!isValidUUID(id)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    if (files && files.length > 0) {
      dto.imageUrls = files.map(file => buildUploadUrl('PRODUCTS', file.filename));
    }
    
    // Processar mlAttributes usando helper centralizado
    if (dto.mlAttributes) {
      const parsed = parseMlAttributes(dto.mlAttributes);
      dto.mlAttributes = parsed || dto.mlAttributes;
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
