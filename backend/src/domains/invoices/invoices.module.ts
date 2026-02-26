import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './entities/invoice.entity';
import { OrdersModule } from '../orders/orders.module';
import { MarketplaceModule } from '../../integrations/marketplace/marketplace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    forwardRef(() => OrdersModule),
    forwardRef(() => MarketplaceModule),
    MulterModule.register({
      dest: './uploads/invoices',
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
