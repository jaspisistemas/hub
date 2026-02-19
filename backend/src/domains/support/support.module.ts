import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { Support } from './entities/support.entity';
import { MarketplaceModule } from '../../integrations/marketplace/marketplace.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Support]),
    forwardRef(() => MarketplaceModule),
    forwardRef(() => StoresModule),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
