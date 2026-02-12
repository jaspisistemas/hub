import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCompaniesAndMembers1707400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de empresas
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cnpj',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'zipCode',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Criar tabela de membros
    await queryRunner.createTable(
      new Table({
        name: 'company_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'companyId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'member'",
          },
          {
            name: 'permissions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'inviteToken',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'inviteSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Adicionar chaves estrangeiras
    await queryRunner.createForeignKey(
      'company_members',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'companies',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'company_members',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );

    // Adicionar coluna companyId a users
    await queryRunner.addColumn(
      'users',
      new (require('typeorm').TableColumn)({
        name: 'companyId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adicionar coluna companyId a stores
    await queryRunner.addColumn(
      'stores',
      new (require('typeorm').TableColumn)({
        name: 'companyId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Tornar userId nullable em stores
    await queryRunner.changeColumn(
      'stores',
      'userId',
      new (require('typeorm').TableColumn)({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Adicionar índices
    await queryRunner.createIndex(
      'company_members',
      new TableIndex({
        columnNames: ['companyId', 'userId'],
      }),
    );

    await queryRunner.createIndex(
      'company_members',
      new TableIndex({
        columnNames: ['inviteToken'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('company_members');
    await queryRunner.dropTable('companies');
    
    await queryRunner.dropColumn('users', 'companyId');
    await queryRunner.dropColumn('stores', 'companyId');
  }
}
