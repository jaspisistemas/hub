import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderCreatedAtToOrders1707600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'orderCreatedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'orderCreatedAt');
  }
}
