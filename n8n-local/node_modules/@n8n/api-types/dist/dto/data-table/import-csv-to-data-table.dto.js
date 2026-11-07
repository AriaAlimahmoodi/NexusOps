"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportCsvToDataTableDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class ImportCsvToDataTableDto extends zod_class_1.Z.class({
    fileId: zod_1.z.string().min(1),
}) {
}
exports.ImportCsvToDataTableDto = ImportCsvToDataTableDto;
//# sourceMappingURL=import-csv-to-data-table.dto.js.map