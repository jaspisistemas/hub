import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './domains/orders/orders.module';
import { MarketplaceModule } from './integrations/marketplace/marketplace.module';
import { QueueModule } from './infra/queue/queue.module';
import { WebsocketModule } from './infra/websocket/websocket.module';
import { AuthModule } from './domains/auth/auth.module';
import { User } from './domains/auth/entities/user.entity';
import { Product } from './domains/products/entities/product.entity';
import { Customer } from './domains/customers/entities/customer.entity';
import { Store } from './domains/stores/entities/store.entity';
import { Order } from './domains/orders/entities/order.entity';
import { ProductsModule } from './domains/products/products.module';
import { CustomersModule } from './domains/customers/customers.module';
import { StoresModule } from './domains/stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'jaspi_hub.db',
      entities: [User, Product, Customer, Store, Order],
      synchronize: true,
    }),
    AuthModule,
    ProductsModule,
    CustomersModule,
    StoresModule,
    OrdersModule,
    MarketplaceModule,
    QueueModule,
    WebsocketModule,
  ],
})
export class AppModule {}
