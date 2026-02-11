import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Store } from '../stores/entities/store.entity';
import { WebsocketModule } from '../../infra/websocket/websocket.module';
import { MarketplaceModule } from '../../integrations/marketplace/marketplace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Store]),
    WebsocketModule,
    forwardRef(() => MarketplaceModule),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
