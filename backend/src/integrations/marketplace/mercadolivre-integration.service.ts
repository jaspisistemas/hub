import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

interface MLShipmentData {
  order_id: string;
  shipment_id: string;
  tracking_number?: string;
  invoice_number: string;
  invoice_key: string;
  pdf_url?: string;
}

@Injectable()
export class MercadoLivreIntegrationService {
  private readonly logger = new Logger(MercadoLivreIntegrationService.name);
  private readonly mlApiUrl = 'https://api.mercadolibre.com';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Envia nota fiscal para o Mercado Livre
   * Tenta via Pack (Flex/Turbo/ME1/Drop Off) primeiro
   * Se falhar com 403, tenta via Shipment (Places/Coletas/xd_drop_off/xd_same_day/cross_docking)
   */
  async sendInvoiceToMarketplace(
    orderId: string,
    mlOrderId: string,
    packId: string,
    invoiceNumber: string,
    invoiceKey: string,
    accessToken: string,
    pdfPath?: string,
    xmlContent?: string,
    shipmentId?: string,
  ): Promise<any> {
    try {
      if (!accessToken) {
        this.logger.warn('Token do Mercado Livre não configurado');
        return {
          success: false,
          message: 'Token do Mercado Livre não configurado',
        };
      }

      if (!packId) {
        this.logger.warn('Pack ID não encontrado');
        return {
          success: false,
          message: 'Pack ID não encontrado. Sincronize o pedido novamente.',
        };
      }

      // Endpoint oficial do Mercado Livre para envio de documentos fiscais
      const url = `${this.mlApiUrl}/packs/${packId}/fiscal_documents`;

      const formData = new FormData();

      // Adicionar arquivo - apenas o arquivo, sem metadados adicionais
      // ML vai extrair number e key do próprio XML
      // Prioridade: XML (mais completo) > PDF
      if (xmlContent) {
        // Enviar XML content como arquivo
        const xmlBuffer = Buffer.from(xmlContent, 'utf-8');
        formData.append('file', xmlBuffer, {
          filename: `NFe${invoiceKey}.xml`,
          contentType: 'application/xml',
        });
        this.logger.log(`Enviando XML da NF (${xmlBuffer.length} bytes) com chave ${invoiceKey}`);
      } else if (pdfPath) {
        // Ler PDF do disco e enviar
        const fullPath = path.join(process.cwd(), pdfPath);
        
        if (fs.existsSync(fullPath)) {
          const pdfStream = fs.createReadStream(fullPath);
          formData.append('file', pdfStream, {
            filename: `NFe${invoiceNumber}.pdf`,
            contentType: 'application/pdf',
          });
          this.logger.log(`Enviando PDF da NF: ${fullPath}`);
        } else {
          this.logger.warn(`Arquivo PDF não encontrado: ${fullPath}`);
          return {
            success: false,
            message: 'Arquivo da nota fiscal não encontrado no servidor',
          };
        }
      } else {
        return {
          success: false,
          message: 'Nenhum arquivo de nota fiscal disponível (XML ou PDF)',
        };
      }

      this.logger.log(`Enviando NF para ML - URL: ${url}, Pack ID: ${packId}`);
      this.logger.log(`FormData headers: ${JSON.stringify(formData.getHeaders())}`);
      this.logger.log(`Apenas 1 arquivo sendo enviado no campo 'file'`);

      // Tentar deletar nota fiscal existente antes de enviar nova
      try {
        this.logger.log(`Tentando deletar NF existente do pack ${packId}...`);
        await firstValueFrom(
          this.httpService.delete(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }),
        );
        this.logger.log(`NF existente deletada com sucesso`);
      } catch (deleteError: any) {
        // Ignorar erro 404 (não existe NF para deletar)
        if (deleteError.response?.status === 404) {
          this.logger.log(`Nenhuma NF existente para deletar (404)`);
        } else {
          this.logger.warn(`Erro ao deletar NF existente: ${deleteError.message}`);
        }
      }

      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );

      this.logger.log(`NF enviada com sucesso para ML - Status: ${response.status}`);

      return {
        success: true,
        message: 'Nota fiscal enviada ao Mercado Livre com sucesso',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao enviar NF via Pack: ${error.message}`);
      
      // Log detalhado da resposta de erro
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Resposta completa: ${JSON.stringify(error.response.data)}`);
        
        // Se erro 403 (acesso negado), tentar via Shipment
        if (error.response.status === 403 && shipmentId && xmlContent) {
          this.logger.log(`Tentando envio via Shipment (shipmentId: ${shipmentId})...`);
          return await this.sendInvoiceViaShipment(
            shipmentId,
            invoiceNumber,
            invoiceKey,
            xmlContent,
            accessToken,
          );
        }
      }

      // Tratamento específico de erros
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Token inválido ou expirado do Mercado Livre',
        };
      }

      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Shipment não encontrado no Mercado Livre',
        };
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            JSON.stringify(error.response?.data);
        return {
          success: false,
          message: `Erro de validação do Mercado Livre: ${errorMessage}`,
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar nota fiscal ao marketplace',
        error: error.message,
      };
    }
  }

  /**
   * Envia nota fiscal via Shipment (Places/Coletas/Coleta Rápida)
   * Usado para xd_drop_off, xd_same_day, cross_docking
   */
  async sendInvoiceViaShipment(
    shipmentId: string,
    invoiceNumber: string,
    invoiceKey: string,
    xmlContent: string,
    accessToken: string,
  ): Promise<any> {
    try {
      this.logger.log(`Enviando NF via Shipment API - Shipment ID: ${shipmentId}`);

      const url = `${this.mlApiUrl}/shipments/${shipmentId}/invoice_data/?siteId=MLB`;

      // O endpoint de shipment espera o XML diretamente
      this.logger.log(`Enviando XML direto (${xmlContent.length} bytes)`);

      const response = await firstValueFrom(
        this.httpService.post(url, xmlContent, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/xml',
          },
        }),
      );

      this.logger.log(`NF enviada via Shipment com sucesso - Status: ${response.status}`);

      return {
        success: true,
        message: 'Nota fiscal enviada ao Mercado Livre via Shipment com sucesso',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao enviar NF via Shipment: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Resposta completa: ${JSON.stringify(error.response.data)}`);
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar nota fiscal via Shipment',
        error: error.message,
      };
    }
  }

  /**
   * Obtém dados do shipment do Mercado Livre
   */
  async getShipmentData(mlOrderId: string, shipmentId: string): Promise<any> {
    try {
      const token = this.configService.get('MERCADOLIVRE_ACCESS_TOKEN');

      if (!token) {
        throw new BadRequestException('Token do Mercado Livre não configurado');
      }

      const url = `${this.mlApiUrl}/mshops/${mlOrderId}/shipments/${shipmentId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Erro ao obter dados do shipment: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Erro ao obter dados do shipment',
      );
    }
  }

  /**
   * Atualiza status do shipment com rastreamento
   */
  async updateShipmentTracking(
    mlOrderId: string,
    shipmentId: string,
    trackingNumber: string,
    carrier?: string,
  ): Promise<any> {
    try {
      const token = this.configService.get('MERCADOLIVRE_ACCESS_TOKEN');

      if (!token) {
        throw new BadRequestException('Token do Mercado Livre não configurado');
      }

      const url = `${this.mlApiUrl}/mshops/${mlOrderId}/shipments/${shipmentId}`;

      const payload = {
        tracking: {
          number: trackingNumber,
          carrier: carrier || 'Transportadora',
        },
      };

      const response = await firstValueFrom(
        this.httpService.put(url, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Erro ao atualizar rastreamento: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Erro ao atualizar rastreamento',
      );
    }
  }
}
