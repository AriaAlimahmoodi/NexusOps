"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDataTableColumnDto = void 0;
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
class AddDataTableColumnDto extends zod_class_1.Z.class(data_table_schema_1.dataTableCreateColumnSchema.shape) {
}
exports.AddDataTableColumnDto = AddDataTableColumnDto;
//# sourceMappingURL=add-data-table-column.dto.js.map