"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertDataTableRowDto = void 0;
const zod_1 = require("zod");
const data_table_filter_schema_1 = require("../../schemas/data-table-filter.schema");
const data_table_schema_1 = require("../../schemas/data-table.schema");
const zod_class_1 = require("../../zod-class");
const upsertFilterSchema = data_table_filter_schema_1.dataTableFilterSchema.refine((filter) => filter.filters.length > 0, {
    message: 'filter must not be empty',
});
const upsertDataTableRowShape = {
    filter: upsertFilterSchema,
    data: zod_1.z
        .record(data_table_schema_1.dataTableColumnNameSchema, data_table_schema_1.dataTableColumnValueSchema)
        .refine((obj) => Object.keys(obj).length > 0, {
        message: 'data must not be empty',
    }),
    returnData: zod_1.z.boolean().optional().default(false),
    dryRun: zod_1.z.boolean().optional().default(false),
};
class UpsertDataTableRowDto extends zod_class_1.Z.class(upsertDataTableRowShape) {
}
exports.UpsertDataTableRowDto = UpsertDataTableRowDto;
//# sourceMappingURL=upsert-data-table-row.dto.js.map