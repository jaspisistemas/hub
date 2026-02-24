import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompaniesInviteController } from './companies-invite.controller';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyMember, User])],
  controllers: [CompaniesController, CompaniesInviteController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
