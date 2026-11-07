"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeactivateWorkflowDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class DeactivateWorkflowDto extends zod_class_1.Z.class({
    expectedChecksum: zod_1.z.string().optional(),
}) {
}
exports.DeactivateWorkflowDto = DeactivateWorkflowDto;
//# sourceMappingURL=deactivate-workflow.dto.js.map