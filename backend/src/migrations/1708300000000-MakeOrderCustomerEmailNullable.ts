import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeOrderCustomerEmailNullable1708300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'orders',
      'customerEmail',
      new TableColumn({
        name: 'customerEmail',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'orders',
      'customerEmail',
      new TableColumn({
        name: 'customerEmail',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );
  }
}
