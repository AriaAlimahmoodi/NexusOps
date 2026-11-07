"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveWorkflowDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class ArchiveWorkflowDto extends zod_class_1.Z.class({
    expectedChecksum: zod_1.z.string().optional(),
}) {
}
exports.ArchiveWorkflowDto = ArchiveWorkflowDto;
//# sourceMappingURL=archive-workflow.dto.js.map