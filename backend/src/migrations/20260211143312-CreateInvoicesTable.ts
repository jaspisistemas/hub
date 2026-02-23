import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateInvoicesTable20260211143312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'series',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'accessKey',
            type: 'varchar',
            length: '44',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'xmlContent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pdfUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'issueDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sentToMarketplace',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sentAt',
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
      true,
    );

    // Foreign key para orders
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('invoices');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('orderId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('invoices', foreignKey);
    }
    await queryRunner.dropTable('invoices');
  }
}