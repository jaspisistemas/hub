import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExternalOrderAndShipmentIdToOrders1707561600000
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'externalOrderId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'externalShipmentId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'externalShipmentId');
    await queryRunner.dropColumn('orders', 'externalOrderId');
  }
}
