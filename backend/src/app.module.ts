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
import { Support } from './domains/support/entities/support.entity';
import { ProductsModule } from './domains/products/products.module';
import { StoresModule } from './domains/stores/stores.module';
import { SupportModule } from './domains/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'jaspi_hub',
      entities: [User, Product, Store, Order, Support],
      synchronize: true, // Sincroniza automaticamente as mudanças na estrutura
    }),
    AuthModule,
    ProductsModule,
    StoresModule,
    SupportModule,
    OrdersModule,
    MarketplaceModule,
    QueueModule,
    WebsocketModule,
    // JobsModule, // Desabilitado temporariamente (requer Redis)
  ],
})
export class AppModule {}
