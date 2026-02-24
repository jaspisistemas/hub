import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationToUsers20260224150000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerifiedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationSentAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.query(
      'UPDATE "users" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'emailVerificationSentAt');
    await queryRunner.dropColumn('users', 'emailVerificationToken');
    await queryRunner.dropColumn('users', 'emailVerifiedAt');
  }
}
