import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderMessageFieldsToSupports1707300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campo orderExternalId
    await queryRunner.addColumn(
      'supports',
      new TableColumn({
        name: 'orderExternalId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Adicionar campo packId
    await queryRunner.addColumn(
      'supports',
      new TableColumn({
        name: 'packId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Adicionar novo valor ao enum type
    await queryRunner.query(`
      ALTER TYPE support_type_enum ADD VALUE IF NOT EXISTS 'mensagem_venda';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('supports', 'orderExternalId');
    await queryRunner.dropColumn('supports', 'packId');
    // Nota: não é possível remover valores de um enum no PostgreSQL facilmente
  }
}
