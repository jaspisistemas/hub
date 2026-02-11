import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerInvoiceConfig } from '../../config/multer-invoice.config';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return await this.invoicesService.create(createInvoiceDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerInvoiceConfig))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('orderId') orderId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!orderId) {
      throw new BadRequestException('orderId é obrigatório');
    }

    return await this.invoicesService.createFromFile(orderId, file);
  }

  @Get()
  async findAll() {
    return await this.invoicesService.findAll();
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    return await this.invoicesService.findByOrderId(orderId);
  }

  @Get('order/:orderId/invoice-data')
  async getInvoiceData(@Param('orderId') orderId: string) {
    return await this.invoicesService.getInvoiceDataForOrder(orderId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.invoicesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return await this.invoicesService.update(id, updateInvoiceDto);
  }

  @Post(':id/mark-sent')
  @HttpCode(HttpStatus.OK)
  async markAsSent(@Param('id') id: string) {
    return await this.invoicesService.markAsSent(id);
  }

  @Post(':id/mark-failed')
  @HttpCode(HttpStatus.OK)
  async markAsFailed(
    @Param('id') id: string,
    @Body('errorMessage') errorMessage: string,
  ) {
    return await this.invoicesService.markAsFailed(id, errorMessage);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.invoicesService.remove(id);
  }
}
