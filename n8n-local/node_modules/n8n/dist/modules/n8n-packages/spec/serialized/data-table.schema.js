"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedDataTableSchema = exports.serializedDataTableColumnSchema = void 0;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const reservedColumnNames = new Set([...n8n_workflow_1.DATA_TABLE_SYSTEM_COLUMNS, n8n_workflow_1.DATA_TABLE_SYSTEM_TESTING_COLUMN].map((name) => name.toLowerCase()));
exports.serializedDataTableColumnSchema = zod_1.z
    .object({
    id: api_types_1.dataTableIdSchema.min(1).optional(),
    name: api_types_1.dataTableColumnNameSchema,
    type: api_types_1.dataTableColumnTypeSchema,
    index: zod_1.z.number().int(),
})
    .strict();
exports.serializedDataTableSchema = zod_1.z
    .object({
    id: api_types_1.dataTableIdSchema.min(1),
    name: api_types_1.dataTableNameSchema,
    columns: zod_1.z.array(exports.serializedDataTableColumnSchema),
})
    .strict()
    .superRefine(({ columns }, ctx) => {
    const seen = new Set();
    columns.forEach((column, index) => {
        if (reservedColumnNames.has(column.name.toLowerCase())) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['columns', index, 'name'],
                message: `"${column.name}" is a reserved system column name`,
            });
        }
        if (seen.has(column.name)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['columns', index, 'name'],
                message: `duplicate column name "${column.name}"`,
            });
        }
        seen.add(column.name);
    });
});
//# sourceMappingURL=data-table.schema.js.map