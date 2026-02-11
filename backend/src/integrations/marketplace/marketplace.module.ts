import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { OrdersModule } from '../../domains/orders/orders.module';
import { StoresModule } from '../../domains/stores/stores.module';
import { ProductsModule } from '../../domains/products/products.module';
import { SupportModule } from '../../domains/support/support.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    StoresModule,
    ProductsModule,
    forwardRef(() => SupportModule),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MercadoLivreAdapter, ShopeeAdapter],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
