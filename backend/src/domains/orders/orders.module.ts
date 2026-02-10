import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Store } from '../stores/entities/store.entity';
import { WebsocketModule } from '../../infra/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Store]),
    WebsocketModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
