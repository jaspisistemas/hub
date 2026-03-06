import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from './domains/auth/entities/user.entity';
import { Product } from './domains/products/entities/product.entity';
import { Store } from './domains/stores/entities/store.entity';
import { Order } from './domains/orders/entities/order.entity';
import { Support } from './domains/support/entities/support.entity';
import { Invoice } from './domains/invoices/entities/invoice.entity';
import { Company } from './domains/companies/entities/company.entity';
import { CompanyMember } from './domains/companies/entities/company-member.entity';

// Carrega .env do backend (nao do cwd - importante para migrations em monorepo)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Em producao (dist/): usa migrations compiladas .js. Em dev (ts-node): usa .ts
const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep) || __dirname.endsWith(path.sep + 'dist');
const migrationsDir = path.join(__dirname, 'migrations');
const migrationsExt = isCompiled ? '.js' : '.ts';
const migrationFiles = [
  '1707100000000-InitialSchema',
  '1707200000000-AddMercadoLivreFieldsToStores',
  '1707300000000-AddOrderMessageFieldsToSupports',
  '1707400000000-CreateCompaniesAndMembers',
  '1707400000001-AddProfileFieldsToUsers',
  '1707500000000-AddCompanyIdToStores',
  '1707561600000-AddExternalOrderAndShipmentIdToOrders',
  '1707600000000-AddOrderCreatedAtToOrders',
  '1707700000000-AddCompanyIdToUsers',
  '1707800000000-FixCompanyMembersIsActiveColumn',
  '1707900000000-DropEmailFromCompanyMembers',
  '1708200000000-UpdateSupportStoreFkOnDelete',
  '1708300000000-MakeOrderCustomerEmailNullable',
  '1708961000000-AddExternalPackIdToOrders',
  '1708962000000-CreateInvoicesTable',
  '1708963000000-AddEmailVerificationToUsers',
  '1708964000000-AddMlTokenFieldsToStores',
  '1708965000000-AddCompanyVersionFields',
  '1708967000000-RenameCompanyVersionColumnsToCamelCase',
];
const migrations = migrationFiles.map((f) => path.join(migrationsDir, f + migrationsExt));

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jaspi_hub',
  entities: [User, Product, Store, Order, Support, Invoice, Company, CompanyMember],
  migrations,
  synchronize: false,
  logging: true,
});
