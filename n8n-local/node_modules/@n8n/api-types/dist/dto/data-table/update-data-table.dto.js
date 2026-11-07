"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDataTableDto = void 0;
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class UpdateDataTableDto extends zod_class_1.Z.class({
    name: data_table_schema_1.dataTableNameSchema,
}) {
}
exports.UpdateDataTableDto = UpdateDataTableDto;
//# sourceMappingURL=update-data-table.dto.js.map