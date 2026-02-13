import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCompanyIdToStores1707500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna companyId
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'companyId',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Adicionar foreign key
    await queryRunner.createForeignKey(
      'stores',
      new TableForeignKey({
        columnNames: ['companyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'companies',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    const table = await queryRunner.getTable('stores');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.includes('companyId'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('stores', foreignKey);
    }

    // Remover coluna
    await queryRunner.dropColumn('stores', 'companyId');
  }
}
