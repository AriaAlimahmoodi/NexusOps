"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteDataTableRowsDto = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const data_table_filter_schema_1 = require("../../schemas/data-table-filter.schema");
const zod_class_1 = require("../../zod-class");
const dataTableFilterQueryValidator = zod_1.z.string().transform((val, ctx) => {
    if (!val) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Filter is required for delete operations',
            path: ['filter'],
        });
        return zod_1.z.NEVER;
    }
    try {
        const parsed = (0, n8n_workflow_1.jsonParse)(val);
        try {
            const result = data_table_filter_schema_1.dataTableFilterSchema.parse(parsed);
            if (!result.filters || result.filters.length === 0) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'At least one filter condition is required for delete operations',
                    path: ['filter'],
                });
                return zod_1.z.NEVER;
            }
            return result;
        }
        catch (e) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Invalid filter fields',
                path: ['filter'],
            });
            return zod_1.z.NEVER;
        }
    }
    catch (e) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Invalid filter format',
            path: ['filter'],
        });
        return zod_1.z.NEVER;
    }
});
const booleanValidator = zod_1.z
    .union([zod_1.z.string(), zod_1.z.boolean()])
    .optional()
    .transform((val) => {
    if (typeof val === 'string') {
        return val === 'true';
    }
    return val ?? false;
});
const deleteDataTableRowsShape = {
    filter: dataTableFilterQueryValidator,
    returnData: booleanValidator,
    dryRun: booleanValidator,
};
class DeleteDataTableRowsDto extends zod_class_1.Z.class(deleteDataTableRowsShape) {
}
exports.DeleteDataTableRowsDto = DeleteDataTableRowsDto;
//# sourceMappingURL=delete-data-table-rows.dto.js.map