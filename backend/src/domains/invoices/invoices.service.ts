import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceDataDto } from './dto/invoice-data.dto';
import { OrdersService } from '../orders/orders.service';
import { MercadoLivreIntegrationService } from '../../integrations/marketplace/mercadolivre-integration.service';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => MercadoLivreIntegrationService))
    private mlIntegrationService: MercadoLivreIntegrationService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Verifica se já existe uma nota para este pedido
    const existingInvoice = await this.invoicesRepository.findOne({
      where: { orderId: createInvoiceDto.orderId },
    });

    if (existingInvoice) {
      throw new BadRequestException('Já existe uma nota fiscal para este pedido');
    }

    const invoice = this.invoicesRepository.create({
      ...createInvoiceDto,
      status: 'generated',
      issueDate: createInvoiceDto.issueDate ? new Date(createInvoiceDto.issueDate) : new Date(),
    });

    return await this.invoicesRepository.save(invoice);
  }

  async findAll(): Promise<Invoice[]> {
    return await this.invoicesRepository.find({
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrderId(orderId: string): Promise<Invoice | null> {
    return await this.invoicesRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!invoice) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    const updated = Object.assign(invoice, {
      ...updateInvoiceDto,
      issueDate: updateInvoiceDto.issueDate ? new Date(updateInvoiceDto.issueDate) : invoice.issueDate,
      sentAt: updateInvoiceDto.sentAt ? new Date(updateInvoiceDto.sentAt) : invoice.sentAt,
    });

    return await this.invoicesRepository.save(updated);
  }

  async markAsSent(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    invoice.sentToMarketplace = true;
    invoice.sentAt = new Date();
    invoice.status = 'sent';

    return await this.invoicesRepository.save(invoice);
  }

  async markAsFailed(id: string, errorMessage: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    invoice.status = 'failed';
    invoice.errorMessage = errorMessage;

    return await this.invoicesRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    
    // Remover arquivo físico se existir
    if (invoice.pdfUrl) {
      const fullPath = path.join(process.cwd(), invoice.pdfUrl);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Arquivo da nota fiscal removido: ${fullPath}`);
        } catch (error) {
          console.error(`Erro ao remover arquivo físico: ${error.message}`);
          // Não falha a operação se não conseguir remover o arquivo
        }
      }
    }
    
    await this.invoicesRepository.remove(invoice);
  }

  async getInvoiceDataForOrder(orderId: string): Promise<InvoiceDataDto> {
    // Buscar pedido completo
    const order = await this.ordersService.getOrderById(orderId);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Parse do rawData
    let rawData: any = {};
    try {
      rawData = typeof order.rawData === 'string' 
        ? JSON.parse(order.rawData) 
        : order.rawData || {};
    } catch {
      rawData = {};
    }

    // Extrair dados do endereço de entrega
    const shipping = rawData.shipping || {};
    const receiverAddress = shipping.receiver_address || {};
    
    // Extrair items/produtos
    const orderItems = rawData.order_items || rawData.items || [];
    const items = orderItems.map((item: any) => ({
      productId: item.item?.id,
      title: item.item?.title || item.title || 'Produto',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || Number(item.sale_price) || 0,
      totalPrice: Number(item.full_unit_price) || (Number(item.quantity) * Number(item.unit_price)) || 0,
      sku: item.item?.seller_sku,
      ncm: item.item?.ncm,
      cfop: item.item?.cfop,
    }));

    // Calcular valores
    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const shippingCost = Number(shipping.cost || shipping.shipping_cost) || 0;
    const discount = Number(rawData.discount) || 0;
    const total = Number(order.total) || subtotal + shippingCost - discount;

    // Extrair taxas
    const taxes = {
      marketplaceFee: orderItems.reduce((sum: number, item: any) => 
        sum + (Number(item.sale_fee) || 0), 0),
      shippingFee: Number(shipping.shipping_cost) || 0,
    };

    // Montar DTO
    const invoiceData: InvoiceDataDto = {
      orderId: order.id,
      orderNumber: order.externalId || order.id,
      orderDate: order.createdAt,
      totalAmount: total,

      // Dados do cliente
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerCpfCnpj: rawData.buyer?.billing_info?.doc_number || 
                       rawData.buyer?.identification?.number,
      customerInscricaoEstadual: rawData.buyer?.billing_info?.registration_number,

      // Endereço de entrega
      shippingAddress: {
        street: receiverAddress.street_name || order.customerAddress || '',
        number: receiverAddress.street_number || '',
        complement: receiverAddress.comment || receiverAddress.complement,
        neighborhood: receiverAddress.neighborhood || '',
        city: receiverAddress.city?.name || order.customerCity || '',
        state: receiverAddress.state?.id || order.customerState || '',
        zipCode: receiverAddress.zip_code || order.customerZipCode || '',
        country: receiverAddress.country?.id || 'BR',
      },

      // Dados de faturamento (se disponível)
      billingAddress: rawData.buyer?.billing_info?.address ? {
        street: rawData.buyer.billing_info.address.street_name || '',
        number: rawData.buyer.billing_info.address.street_number || '',
        complement: rawData.buyer.billing_info.address.comment,
        neighborhood: rawData.buyer.billing_info.address.neighborhood || '',
        city: rawData.buyer.billing_info.address.city?.name || '',
        state: rawData.buyer.billing_info.address.state?.id || '',
        zipCode: rawData.buyer.billing_info.address.zip_code || '',
        country: rawData.buyer.billing_info.address.country?.id || 'BR',
      } : undefined,

      // Produtos
      items,

      // Valores
      subtotal,
      shippingCost,
      discount,
      total,

      // Taxas
      taxes,

      // Dados da loja
      store: order.store ? {
        id: order.store.id,
        name: order.store.name,
      } : undefined,

      // Dados brutos
      rawData,
    };

    return invoiceData;
  }

  async createFromFile(orderId: string, file: Express.Multer.File): Promise<Invoice> {
    // Verifica se já existe uma nota para este pedido
    const existingInvoice = await this.invoicesRepository.findOne({
      where: { orderId },
    });

    if (existingInvoice) {
      throw new BadRequestException('Já existe uma nota fiscal para este pedido');
    }

    // Verifica se o pedido existe
    const order = await this.ordersService.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const fileExt = path.extname(file.filename).toLowerCase();
    let invoiceData: Partial<Invoice> = {
      orderId,
      status: 'generated',
      issueDate: new Date(),
    };

    // Se for XML, tentar extrair dados
    if (fileExt === '.xml') {
      try {
        const xmlContent = fs.readFileSync(file.path, 'utf-8');
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsedXml = parser.parse(xmlContent);

        // Tentar extrair dados da NFe (estrutura padrão brasileira)
        const nfe = parsedXml?.nfeProc?.NFe?.infNFe || parsedXml?.NFe?.infNFe || {};
        const ide = nfe?.ide || {};
        const dest = nfe?.dest || {};

        invoiceData.number = ide.nNF || ide.numero;
        invoiceData.series = ide.serie;
        invoiceData.accessKey = nfe['@_Id']?.replace('NFe', '') || ide.chNFe;
        invoiceData.xmlContent = xmlContent;

        console.log('Dados extraídos do XML:', { 
          number: invoiceData.number, 
          series: invoiceData.series,
          accessKey: invoiceData.accessKey?.substring(0, 10) + '...'
        });
      } catch (err) {
        console.error('Erro ao processar XML:', err);
        // Continua sem os dados extraídos
      }
    }

    // Se for PDF, apenas salvar o caminho
    if (fileExt === '.pdf') {
      invoiceData.pdfUrl = `/uploads/invoices/${file.filename}`;
    }

    const invoice = this.invoicesRepository.create(invoiceData);
    return await this.invoicesRepository.save(invoice);
  }

  async sendToMarketplace(
    invoiceId: string, 
    mlOrderId?: string,
    packId?: string,
  ): Promise<any> {
    // Buscar a nota fiscal
    const invoice = await this.findOne(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    if (invoice.sentToMarketplace) {
      throw new BadRequestException('Esta nota fiscal já foi enviada ao marketplace');
    }

    if (!invoice.number || !invoice.accessKey) {
      throw new BadRequestException('Nota fiscal deve ter número e chave de acesso para ser enviada');
    }

    // Buscar o pedido associado com a store
    const order = await this.ordersService.getOrderById(invoice.orderId);

    if (!order) {
      throw new NotFoundException('Pedido associado não encontrado');
    }

    // Verificar se o pedido tem uma store com token do Mercado Livre
    if (!order.store && order.storeId) {
      // Se order.store não foi carregado, precisamos fazer isso
      const { ordersRepository } = this.ordersService as any;
      const fullOrder = await (ordersRepository as any).findOne({
        where: { id: order.id },
        relations: ['store'],
      });
      if (fullOrder) {
        order.store = fullOrder.store;
      }
    }

    if (!order.store?.mlAccessToken) {
      throw new BadRequestException(
        'Loja não possui token de autenticação com o Mercado Livre. Conecte a loja primeiro.',
      );
    }

    // Se não forneceu mlOrderId ou packId, tentar obter do pedido
    const finalMlOrderId = mlOrderId || order.externalOrderId || order.id;
    const finalPackId = packId || order.externalPackId;

    if (!finalPackId) {
      throw new BadRequestException(
        'Pack ID não fornecido e não encontrado no pedido. Sincronize o pedido novamente para obter o Pack ID do Mercado Livre.',
      );
    }

    try {
      // Enviar para o Mercado Livre
      const result = await this.mlIntegrationService.sendInvoiceToMarketplace(
        invoice.orderId,
        finalMlOrderId,
        finalPackId,
        invoice.number,
        invoice.accessKey,
        order.store.mlAccessToken,
        invoice.pdfUrl,
        invoice.xmlContent,
        order.externalShipmentId, // Adicionar shipmentId para fallback
      );

      // Se bem-sucedido, atualizar o status
      if (result.success) {
        invoice.sentToMarketplace = true;
        invoice.sentAt = new Date();
        invoice.status = 'sent';
        await this.invoicesRepository.save(invoice);
      }

      return result;
    } catch (error: any) {
      console.error('Erro ao enviar para marketplace:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar nota fiscal ao marketplace',
      };
    }
  }
}

