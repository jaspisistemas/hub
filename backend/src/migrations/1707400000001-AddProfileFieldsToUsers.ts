import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileFieldsToUsers1707400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const addColumnIfMissing = async (column: TableColumn) => {
      const exists = await queryRunner.hasColumn('users', column.name);
      if (!exists) {
        await queryRunner.addColumn('users', column);
      }
    };

    await addColumnIfMissing(
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'role',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'companyName',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'cnpj',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'avatarUrl',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'logoUrl',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'theme',
        type: 'varchar',
        default: "'dark'",
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'language',
        type: 'varchar',
        default: "'pt-BR'",
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'currency',
        type: 'varchar',
        default: "'BRL'",
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'defaultDashboardPeriod',
        type: 'int',
        default: 30,
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'notificationsEmail',
        type: 'boolean',
        default: true,
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'notificationsSystem',
        type: 'boolean',
        default: true,
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'lastLoginAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'lastLoginIp',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await addColumnIfMissing(
      new TableColumn({
        name: 'loginHistory',
        type: 'simple-json',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dropColumnIfExists = async (name: string) => {
      const exists = await queryRunner.hasColumn('users', name);
      if (exists) {
        await queryRunner.dropColumn('users', name);
      }
    };

    await dropColumnIfExists('phone');
    await dropColumnIfExists('role');
    await dropColumnIfExists('companyName');
    await dropColumnIfExists('cnpj');
    await dropColumnIfExists('address');
    await dropColumnIfExists('avatarUrl');
    await dropColumnIfExists('logoUrl');
    await dropColumnIfExists('theme');
    await dropColumnIfExists('language');
    await dropColumnIfExists('currency');
    await dropColumnIfExists('defaultDashboardPeriod');
    await dropColumnIfExists('notificationsEmail');
    await dropColumnIfExists('notificationsSystem');
    await dropColumnIfExists('lastLoginAt');
    await dropColumnIfExists('lastLoginIp');
    await dropColumnIfExists('loginHistory');
  }
}