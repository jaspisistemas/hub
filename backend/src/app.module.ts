import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './domains/orders/orders.module';
import { MarketplaceModule } from './integrations/marketplace/marketplace.module';
import { QueueModule } from './infra/queue/queue.module';
import { WebsocketModule } from './infra/websocket/websocket.module';
// import { JobsModule } from './jobs/jobs.module'; // Desabilitado temporariamente (requer Redis)
import { AuthModule } from './domains/auth/auth.module';
import { User } from './domains/auth/entities/user.entity';
import { Product } from './domains/products/entities/product.entity';
import { Store } from './domains/stores/entities/store.entity';
import { Order } from './domains/orders/entities/order.entity';
import { ProductsModule } from './domains/products/products.module';
import { StoresModule } from './domains/stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'jaspi_hub.db',
      entities: [User, Product, Store, Order],
      synchronize: true, // Sincroniza automaticamente as mudanças na estrutura
    }),
    AuthModule,
    ProductsModule,
    StoresModule,
    OrdersModule,
    MarketplaceModule,
    QueueModule,
    WebsocketModule,
    // JobsModule, // Desabilitado temporariamente (requer Redis)
  ],
})
export class AppModule {}
