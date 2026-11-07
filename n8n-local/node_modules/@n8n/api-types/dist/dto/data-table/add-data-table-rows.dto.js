"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDataTableRowsDto = void 0;
const zod_1 = require("zod");
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class AddDataTableRowsDto extends zod_class_1.Z.class({
    data: zod_1.z.array(zod_1.z.record(data_table_schema_1.dataTableColumnNameSchema, data_table_schema_1.dataTableColumnValueSchema)),
    returnType: data_table_schema_1.insertRowReturnType.optional().default('count'),
}) {
}
exports.AddDataTableRowsDto = AddDataTableRowsDto;
//# sourceMappingURL=add-data-table-rows.dto.js.map