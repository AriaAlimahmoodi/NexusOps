"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeDependencyInfoToJson1761655473000 = void 0;
class ChangeDependencyInfoToJson1761655473000 {
    async up({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_dependency`;
        await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "dependencyInfo" TYPE JSON USING NULL`);
    }
}
exports.ChangeDependencyInfoToJson1761655473000 = ChangeDependencyInfoToJson1761655473000;
//# sourceMappingURL=1761655473000-ChangeDependencyInfoToJson.js.map