import { Module } from '@nestjs/common';
import { ProcessOrderJob } from './orders/process-order.job';
import { OrdersQueueService } from './orders/orders-queue.service';
import { OrdersModule } from '../domains/orders/orders.module';
import { QueueModule } from '../infra/queue/queue.module';

@Module({
  imports: [QueueModule, OrdersModule],
  providers: [ProcessOrderJob, OrdersQueueService],
  exports: [ProcessOrderJob, OrdersQueueService],
})
export class JobsModule {}
