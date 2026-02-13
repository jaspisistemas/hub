import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class FixCompanyMembersIsActiveColumn1707800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renomear coluna isactive para isActive
    await queryRunner.query(
      `ALTER TABLE "company_members" RENAME COLUMN "isactive" TO "isActive"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter renomeação
    await queryRunner.query(
      `ALTER TABLE "company_members" RENAME COLUMN "isActive" TO "isactive"`
    );
  }
}
