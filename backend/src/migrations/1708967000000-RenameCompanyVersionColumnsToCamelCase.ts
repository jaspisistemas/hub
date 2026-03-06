import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCompanyVersionColumnsToCamelCase1708967000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const renames: Array<[string, string]> = [
      ['emp_ver', 'empVer'],
      ['emp_att_is', 'empAttIs'],
      ['emp_att_disp', 'empAttDisp'],
      ['emp_att_dta_hor_ini', 'empAttDtaHorIni'],
      ['emp_att_dta_hor_fim', 'empAttDtaHorFim'],
    ];

    for (const [from, to] of renames) {
      const hasFrom = await queryRunner.hasColumn('companies', from);
      const hasTo = await queryRunner.hasColumn('companies', to);
      if (hasFrom && !hasTo) {
        // snake_case -> camelCase (destino com aspas para preservar case no PostgreSQL)
        await queryRunner.query(
          `ALTER TABLE companies RENAME COLUMN ${from.includes('_') ? from : `"${from}"`} TO "${to}"`
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const renames: Array<[string, string]> = [
      ['empVer', 'emp_ver'],
      ['empAttIs', 'emp_att_is'],
      ['empAttDisp', 'emp_att_disp'],
      ['empAttDtaHorIni', 'emp_att_dta_hor_ini'],
      ['empAttDtaHorFim', 'emp_att_dta_hor_fim'],
    ];

    for (const [from, to] of renames) {
      const hasFrom = await queryRunner.hasColumn('companies', from);
      const hasTo = await queryRunner.hasColumn('companies', to);
      if (hasFrom && !hasTo) {
        await queryRunner.query(
          `ALTER TABLE companies RENAME COLUMN "${from}" TO "${to}"`
        );
      }
    }
  }
}
