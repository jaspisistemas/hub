import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMlTokenFieldsToStores1708964000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      { name: 'mlAccessToken', type: 'varchar', length: '500' },
      { name: 'mlRefreshToken', type: 'varchar', length: '500' },
      { name: 'mlTokenExpiresAt', type: 'bigint' },
      { name: 'mlUserId', type: 'varchar', length: '100' },
    ];

    for (const col of cols) {
      const exists = await queryRunner.hasColumn('stores', col.name);
      if (!exists) {
        const def: Record<string, unknown> = {
          name: col.name,
          type: col.type,
          isNullable: true,
        };
        if (col.length) def.length = col.length;
        await queryRunner.addColumn('stores', new TableColumn(def as any));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of ['mlAccessToken', 'mlRefreshToken', 'mlTokenExpiresAt', 'mlUserId']) {
      if (await queryRunner.hasColumn('stores', name)) {
        await queryRunner.dropColumn('stores', name);
      }
    }
  }
}
