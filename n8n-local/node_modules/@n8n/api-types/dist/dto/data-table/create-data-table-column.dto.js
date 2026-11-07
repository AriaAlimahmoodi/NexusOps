"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDataTableColumnDto = void 0;
const zod_1 = require("zod");
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class CreateDataTableColumnDto extends zod_class_1.Z.class({
    name: data_table_schema_1.dataTableColumnNameSchema,
    type: data_table_schema_1.dataTableColumnTypeSchema,
    csvColumnName: zod_1.z.string().optional(),
}) {
}
exports.CreateDataTableColumnDto = CreateDataTableColumnDto;
//# sourceMappingURL=create-data-table-column.dto.js.map