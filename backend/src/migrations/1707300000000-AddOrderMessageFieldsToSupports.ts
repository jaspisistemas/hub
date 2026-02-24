import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderMessageFieldsToSupports1707300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOrderExternalId = await queryRunner.hasColumn('supports', 'orderExternalId');
    if (!hasOrderExternalId) {
      await queryRunner.addColumn(
        'supports',
        new TableColumn({
          name: 'orderExternalId',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    const hasPackId = await queryRunner.hasColumn('supports', 'packId');
    if (!hasPackId) {
      await queryRunner.addColumn(
        'supports',
        new TableColumn({
          name: 'packId',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    const typeExists: Array<{ exists: boolean }> = await queryRunner.query(
      "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_type_enum') AS exists",
    );

    if (typeExists[0]?.exists) {
      await queryRunner.query(
        "ALTER TYPE support_type_enum ADD VALUE IF NOT EXISTS 'mensagem_venda';",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasOrderExternalId = await queryRunner.hasColumn('supports', 'orderExternalId');
    if (hasOrderExternalId) {
      await queryRunner.dropColumn('supports', 'orderExternalId');
    }

    const hasPackId = await queryRunner.hasColumn('supports', 'packId');
    if (hasPackId) {
      await queryRunner.dropColumn('supports', 'packId');
    }
    // Nota: nao e possivel remover valores de um enum no PostgreSQL facilmente
  }
}