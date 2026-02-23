import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMercadoLivreFieldsToStores1707200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campo mlNickname
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'mlNickname',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Adicionar campo mlLastSyncAt
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'mlLastSyncAt',
        type: 'bigint',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('stores', 'mlLastSyncAt');
    await queryRunner.dropColumn('stores', 'mlNickname');
  }
}