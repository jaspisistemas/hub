import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExternalPackIdToOrders1708961000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('orders', 'externalPackId');
    
    if (!hasColumn) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'externalPackId',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('orders', 'externalPackId');
    
    if (hasColumn) {
      await queryRunner.dropColumn('orders', 'externalPackId');
    }
  }
}
