"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDataTableDto = void 0;
const zod_1 = require("zod");
const create_data_table_column_dto_1 = require("./create-data-table-column.dto");
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class CreateDataTableDto extends zod_class_1.Z.class({
    name: data_table_schema_1.dataTableNameSchema,
    columns: zod_1.z.array(create_data_table_column_dto_1.CreateDataTableColumnDto.schema),
    fileId: zod_1.z.string().optional(),
    hasHeaders: zod_1.z.boolean().optional(),
}) {
}
exports.CreateDataTableDto = CreateDataTableDto;
//# sourceMappingURL=create-data-table.dto.js.map