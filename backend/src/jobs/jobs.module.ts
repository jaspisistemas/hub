import { Module } from '@nestjs/common';
import { ProcessOrderJob } from './orders/process-order.job';
import { OrdersQueueService } from './orders/orders-queue.service';
import { SupportSyncSchedule } from './support-sync.schedule';
import { OrdersModule } from '../domains/orders/orders.module';
import { QueueModule } from '../infra/queue/queue.module';
import { SupportModule } from '../domains/support/support.module';
import { StoresModule } from '../domains/stores/stores.module';

@Module({
  imports: [
    QueueModule,
    OrdersModule,
    SupportModule,
    StoresModule,
  ],
  providers: [ProcessOrderJob, OrdersQueueService, SupportSyncSchedule],
  exports: [ProcessOrderJob, OrdersQueueService, SupportSyncSchedule],
})
export class JobsModule {}
