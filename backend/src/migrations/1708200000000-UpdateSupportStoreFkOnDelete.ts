import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class UpdateSupportStoreFkOnDelete1708200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('supports');
    if (!table) return;

    const existingFk = table.foreignKeys.find(fk =>
      fk.columnNames.includes('storeId')
    );

    if (existingFk) {
      await queryRunner.dropForeignKey('supports', existingFk);
    }

    await queryRunner.createForeignKey(
      'supports',
      new TableForeignKey({
        columnNames: ['storeId'],
        referencedTableName: 'stores',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('supports');
    if (!table) return;

    const existingFk = table.foreignKeys.find(fk =>
      fk.columnNames.includes('storeId')
    );

    if (existingFk) {
      await queryRunner.dropForeignKey('supports', existingFk);
    }

    await queryRunner.createForeignKey(
      'supports',
      new TableForeignKey({
        columnNames: ['storeId'],
        referencedTableName: 'stores',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );
  }
}
