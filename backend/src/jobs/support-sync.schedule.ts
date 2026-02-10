import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupportService } from '../domains/support/support.service';
import { StoresService } from '../domains/stores/stores.service';

/**
 * SupportSyncSchedule: serviço que sincroniza automaticamente as mensagens de vendas
 * do Mercado Livre em intervalos regulares
 */
@Injectable()
export class SupportSyncSchedule {
  private readonly logger = new Logger(SupportSyncSchedule.name);

  constructor(
    private readonly supportService: SupportService,
    private readonly storesService: StoresService,
  ) {}

  /**
   * Sincroniza mensagens de vendas a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncSupportMessages() {
    this.logger.log('🔄 Iniciando sincronização automática de mensagens de suporte');

    try {
      // Buscar todas as lojas
      const stores = await this.storesService.findAll();
      
      if (!stores || stores.length === 0) {
        this.logger.warn('⚠️ Nenhuma loja encontrada para sincronizar');
        return;
      }

      this.logger.log(`📦 Processando ${stores.length} loja(s)`);

      for (const store of stores) {
        try {
          // Apenas sincronizar lojas com Mercado Livre configurado
          if (!store.mlAccessToken) {
            this.logger.debug(`⏭️ Loja ${store.name} sem token do Mercado Livre, pulando`);
            continue;
          }

          this.logger.log(`🔄 Sincronizando suporte para loja: ${store.name}`);
          const result = await this.supportService.syncFromMarketplace(store.id);
          
          if (result.imported > 0 || result.updated > 0) {
            this.logger.log(
              `✅ Loja ${store.name}: ${result.imported} importadas, ${result.updated} atualizadas`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `❌ Erro ao sincronizar suporte para loja ${store.name}: ${error?.message || String(error)}`,
            error,
          );
        }
      }

      this.logger.log('✨ Sincronização automática concluída');
    } catch (error) {
      this.logger.error('❌ Erro durante sincronização automática:', error);
    }
  }
}
