import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompanyVersionFields1708965000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      { name: 'empVer', type: 'varchar', length: '50', default: "'0.0.0'" },
      { name: 'empAttIs', type: 'boolean', default: false },
      { name: 'empAttDisp', type: 'varchar', length: '50', nullable: true },
      { name: 'empAttDtaHorIni', type: 'timestamp', nullable: true },
      { name: 'empAttDtaHorFim', type: 'timestamp', nullable: true },
    ];

    for (const col of cols) {
      const exists = await queryRunner.hasColumn('companies', col.name);
      if (!exists) {
        const def: Record<string, unknown> = {
          name: col.name,
          type: col.type,
          isNullable: col.nullable ?? false,
        };
        if (col.length) def.length = col.length;
        if (col.default !== undefined) def.default = col.default;
        await queryRunner.addColumn('companies', new TableColumn(def as any));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of ['empVer', 'empAttIs', 'empAttDisp', 'empAttDtaHorIni', 'empAttDtaHorFim']) {
      if (await queryRunner.hasColumn('companies', name)) {
        await queryRunner.dropColumn('companies', name);
      }
    }
  }
}
