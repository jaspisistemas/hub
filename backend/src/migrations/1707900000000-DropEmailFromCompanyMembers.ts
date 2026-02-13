import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropEmailFromCompanyMembers1707900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna existe antes de dropar
    const table = await queryRunner.getTable('company_members');
    const emailColumn = table?.columns.find(col => col.name === 'email');
    
    if (emailColumn) {
      await queryRunner.dropColumn('company_members', 'email');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter não é prático, mas por segurança:
    const table = await queryRunner.getTable('company_members');
    const emailColumn = table?.columns.find(col => col.name === 'email');
    
    if (!emailColumn) {
      await queryRunner.query(
        `ALTER TABLE "company_members" ADD COLUMN "email" varchar(255)`
      );
    }
  }
}
