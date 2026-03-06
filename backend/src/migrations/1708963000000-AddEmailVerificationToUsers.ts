import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationToUsers1708963000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('users', 'emailVerifiedAt'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerifiedAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('users', 'emailVerificationToken'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerificationToken',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('users', 'emailVerificationSentAt'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'emailVerificationSentAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(
      'UPDATE "users" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('users', 'emailVerificationSentAt')) {
      await queryRunner.dropColumn('users', 'emailVerificationSentAt');
    }
    if (await queryRunner.hasColumn('users', 'emailVerificationToken')) {
      await queryRunner.dropColumn('users', 'emailVerificationToken');
    }
    if (await queryRunner.hasColumn('users', 'emailVerifiedAt')) {
      await queryRunner.dropColumn('users', 'emailVerifiedAt');
    }
  }
}
