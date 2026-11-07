"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeDependencyInfoToJson1761655473000 = void 0;
class ChangeDependencyInfoToJson1761655473000 {
    async up({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_dependency`;
        await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "dependencyInfo"`);
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "dependencyInfo" TEXT CONSTRAINT workflow_dependency_chk_dependency_info_is_json CHECK("dependencyInfo" IS NULL OR json_valid("dependencyInfo"))`);
    }
}
exports.ChangeDependencyInfoToJson1761655473000 = ChangeDependencyInfoToJson1761655473000;
//# sourceMappingURL=1761655473000-ChangeDependencyInfoToJson.js.map