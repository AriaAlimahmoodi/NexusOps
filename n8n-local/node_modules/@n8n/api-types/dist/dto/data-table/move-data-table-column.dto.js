"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveDataTableColumnDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class MoveDataTableColumnDto extends zod_class_1.Z.class({
    targetIndex: zod_1.z.number().int().nonnegative(),
}) {
}
exports.MoveDataTableColumnDto = MoveDataTableColumnDto;
//# sourceMappingURL=move-data-table-column.dto.js.map