import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { MercadoLivreIntegrationService } from './mercadolivre-integration.service';
import { OrdersModule } from '../../domains/orders/orders.module';
import { StoresModule } from '../../domains/stores/stores.module';
import { ProductsModule } from '../../domains/products/products.module';
import { SupportModule } from '../../domains/support/support.module';
import { QueueModule } from '../../infra/queue/queue.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => OrdersModule),
    StoresModule,
    ProductsModule,
    forwardRef(() => SupportModule),
    QueueModule,
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MercadoLivreAdapter, ShopeeAdapter, MercadoLivreIntegrationService],
  exports: [MarketplaceService, MercadoLivreIntegrationService],
})
export class MarketplaceModule {}
