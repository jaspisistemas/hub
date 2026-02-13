import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsActiveToCompanyMembers1707400000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "company_members",
            new TableColumn({
                name: "isActive",
                type: "boolean",
                default: true,
                isNullable: false,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("company_members", "isActive");
    }
}
