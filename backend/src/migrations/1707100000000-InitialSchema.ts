import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migration inicial - cria tabelas base que as demais migrations assumem existir.
 * O schema foi criado originalmente via TypeORM synchronize.
 */
export class InitialSchema1707100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'role', type: 'varchar', length: '50', isNullable: true },
          { name: 'companyName', type: 'varchar', length: '255', isNullable: true },
          { name: 'cnpj', type: 'varchar', length: '50', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'avatarUrl', type: 'varchar', length: '500', isNullable: true },
          { name: 'logoUrl', type: 'varchar', length: '500', isNullable: true },
          { name: 'theme', type: 'varchar', length: '20', default: "'dark'", isNullable: true },
          { name: 'language', type: 'varchar', length: '10', default: "'pt-BR'", isNullable: true },
          { name: 'currency', type: 'varchar', length: '10', default: "'BRL'", isNullable: true },
          { name: 'defaultDashboardPeriod', type: 'int', default: 30, isNullable: true },
          { name: 'notificationsEmail', type: 'boolean', default: true, isNullable: true },
          { name: 'notificationsSystem', type: 'boolean', default: true, isNullable: true },
          { name: 'lastLoginAt', type: 'timestamp', isNullable: true },
          { name: 'lastLoginIp', type: 'varchar', length: '50', isNullable: true },
          { name: 'loginHistory', type: 'json', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'stores',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'marketplace', type: 'varchar', length: '50' },
          { name: 'status', type: 'varchar', length: '50', default: "'active'" },
          { name: 'productsCount', type: 'int', default: 0 },
          { name: 'ordersCount', type: 'int', default: 0 },
          { name: 'revenue', type: 'decimal', precision: 12, scale: 2, default: 0 },
          { name: 'active', type: 'boolean', default: true },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'sku', type: 'varchar', length: '100', isUnique: true },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'quantity', type: 'int', default: 0 },
          { name: 'category', type: 'varchar', length: '100', isNullable: true },
          { name: 'brand', type: 'varchar', length: '100', isNullable: true },
          { name: 'model', type: 'varchar', length: '100', isNullable: true },
          { name: 'active', type: 'boolean', default: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'imageUrls', type: 'text', isNullable: true },
          { name: 'imageUrl', type: 'varchar', length: '500', isNullable: true },
          { name: 'externalId', type: 'varchar', length: '100', isNullable: true },
          { name: 'marketplace', type: 'varchar', length: '50', isNullable: true },
          { name: 'mlCategoryId', type: 'varchar', length: '100', isNullable: true },
          { name: 'mlAttributes', type: 'jsonb', isNullable: true },
          { name: 'storeId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'externalId', type: 'varchar', length: '255', isUnique: true },
          { name: 'marketplace', type: 'varchar', length: '100' },
          { name: 'status', type: 'varchar', length: '100', default: "'pending'" },
          { name: 'total', type: 'decimal', precision: 12, scale: 2 },
          { name: 'rawData', type: 'text', isNullable: true },
          { name: 'customerName', type: 'varchar', length: '255' },
          { name: 'customerEmail', type: 'varchar', length: '255', isNullable: true },
          { name: 'customerPhone', type: 'varchar', length: '20', isNullable: true },
          { name: 'customerCity', type: 'varchar', length: '100', isNullable: true },
          { name: 'customerState', type: 'varchar', length: '10', isNullable: true },
          { name: 'customerAddress', type: 'text', isNullable: true },
          { name: 'customerZipCode', type: 'varchar', length: '20', isNullable: true },
          { name: 'storeId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'supports',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'origin', type: 'varchar', length: '50', default: "'mercado_livre'" },
          { name: 'type', type: 'varchar', length: '50', default: "'pergunta'" },
          { name: 'status', type: 'varchar', length: '50', default: "'nao_respondido'" },
          { name: 'externalId', type: 'varchar', length: '255', isNullable: true },
          { name: 'productExternalId', type: 'varchar', length: '255', isNullable: true },
          { name: 'productTitle', type: 'varchar', length: '500', isNullable: true },
          { name: 'customerName', type: 'varchar', length: '255', isNullable: true },
          { name: 'customerExternalId', type: 'varchar', length: '255', isNullable: true },
          { name: 'question', type: 'text' },
          { name: 'answer', type: 'text', isNullable: true },
          { name: 'questionDate', type: 'timestamp', isNullable: true },
          { name: 'answerDate', type: 'timestamp', isNullable: true },
          { name: 'canAnswer', type: 'boolean', default: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'storeId', type: 'uuid', isNullable: true },
          { name: 'productId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('supports', true);
    await queryRunner.dropTable('orders', true);
    await queryRunner.dropTable('products', true);
    await queryRunner.dropTable('stores', true);
    await queryRunner.dropTable('users', true);
  }
}
