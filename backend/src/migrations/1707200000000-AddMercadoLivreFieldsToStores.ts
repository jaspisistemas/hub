import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMercadoLivreFieldsToStores1707200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasNickname = await queryRunner.hasColumn('stores', 'mlNickname');
    if (!hasNickname) {
      await queryRunner.addColumn(
        'stores',
        new TableColumn({
          name: 'mlNickname',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    const hasLastSyncAt = await queryRunner.hasColumn('stores', 'mlLastSyncAt');
    if (!hasLastSyncAt) {
      await queryRunner.addColumn(
        'stores',
        new TableColumn({
          name: 'mlLastSyncAt',
          type: 'bigint',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasLastSyncAt = await queryRunner.hasColumn('stores', 'mlLastSyncAt');
    if (hasLastSyncAt) {
      await queryRunner.dropColumn('stores', 'mlLastSyncAt');
    }

    const hasNickname = await queryRunner.hasColumn('stores', 'mlNickname');
    if (hasNickname) {
      await queryRunner.dropColumn('stores', 'mlNickname');
    }
  }
}