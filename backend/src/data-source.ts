import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './domains/auth/entities/user.entity';
import { Product } from './domains/products/entities/product.entity';
import { Store } from './domains/stores/entities/store.entity';
import { Order } from './domains/orders/entities/order.entity';
import { Support } from './domains/support/entities/support.entity';
import { Invoice } from './domains/invoices/entities/invoice.entity';
import { Company } from './domains/companies/entities/company.entity';
import { CompanyMember } from './domains/companies/entities/company-member.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jaspi_hub',
  entities: [User, Product, Store, Order, Support, Invoice, Company, CompanyMember],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
