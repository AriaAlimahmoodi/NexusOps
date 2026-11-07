"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameDataTableColumnDto = void 0;
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class RenameDataTableColumnDto extends zod_class_1.Z.class({
    name: data_table_schema_1.dataTableColumnNameSchema,
}) {
}
exports.RenameDataTableColumnDto = RenameDataTableColumnDto;
//# sourceMappingURL=rename-data-table-column.dto.js.map