import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEmailVerificationTokensTable1773056000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'tokenHash',
            type: 'varchar',
            length: '128',
            isUnique: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invalidatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_email_verification_tokens_user_id',
            columnNames: ['userId'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'email_verification_tokens',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('email_verification_tokens');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('userId') && fk.referencedTableName === 'users',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('email_verification_tokens', foreignKey);
    }

    await queryRunner.dropTable('email_verification_tokens');
  }
}
