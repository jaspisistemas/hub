import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCompanyIdToUsers1707700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCompanyId = await queryRunner.hasColumn('users', 'companyId');
    if (!hasCompanyId) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'companyId',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    // Adicionar foreign key (se ainda nao existir)
    const table = await queryRunner.getTable('users');
    const hasFk = table?.foreignKeys.some(
      (fk) => fk.columnNames.includes('companyId') && fk.referencedTableName === 'companies'
    );
    if (!hasFk) {
      await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'companies',
        onDelete: 'SET NULL',
      })
    );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.includes('companyId'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }
    await queryRunner.dropColumn('users', 'companyId');
  }
}
