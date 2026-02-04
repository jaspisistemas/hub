import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { multerConfig } from '../../config/multer.config';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      dto.imageUrls = files.map(file => `/uploads/${file.filename}`);
    }
    return this.productsService.create(dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      dto.imageUrls = files.map(file => `/uploads/${file.filename}`);
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
