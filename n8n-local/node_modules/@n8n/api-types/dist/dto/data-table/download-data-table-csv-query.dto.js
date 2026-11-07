"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadDataTableCsvQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
const booleanValidator = zod_1.z
    .union([zod_1.z.string(), zod_1.z.boolean()])
    .optional()
    .transform((val) => {
    if (typeof val === 'string') {
        return val === 'true';
    }
    return val ?? true;
});
class DownloadDataTableCsvQueryDto extends zod_class_1.Z.class({
    includeSystemColumns: booleanValidator,
}) {
}
exports.DownloadDataTableCsvQueryDto = DownloadDataTableCsvQueryDto;
//# sourceMappingURL=download-data-table-csv-query.dto.js.map