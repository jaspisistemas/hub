import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileFieldsToUsers1707400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'companyName',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'cnpj',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatarUrl',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'logoUrl',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'theme',
        type: 'varchar',
        default: "'dark'",
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'language',
        type: 'varchar',
        default: "'pt-BR'",
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'currency',
        type: 'varchar',
        default: "'BRL'",
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'defaultDashboardPeriod',
        type: 'int',
        default: 30,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'notificationsEmail',
        type: 'boolean',
        default: true,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'notificationsSystem',
        type: 'boolean',
        default: true,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'lastLoginAt',
        type: 'datetime',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'lastLoginIp',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'loginHistory',
        type: 'simple-json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'phone');
    await queryRunner.dropColumn('users', 'role');
    await queryRunner.dropColumn('users', 'companyName');
    await queryRunner.dropColumn('users', 'cnpj');
    await queryRunner.dropColumn('users', 'address');
    await queryRunner.dropColumn('users', 'avatarUrl');
    await queryRunner.dropColumn('users', 'logoUrl');
    await queryRunner.dropColumn('users', 'theme');
    await queryRunner.dropColumn('users', 'language');
    await queryRunner.dropColumn('users', 'currency');
    await queryRunner.dropColumn('users', 'defaultDashboardPeriod');
    await queryRunner.dropColumn('users', 'notificationsEmail');
    await queryRunner.dropColumn('users', 'notificationsSystem');
    await queryRunner.dropColumn('users', 'lastLoginAt');
    await queryRunner.dropColumn('users', 'lastLoginIp');
    await queryRunner.dropColumn('users', 'loginHistory');
  }
}