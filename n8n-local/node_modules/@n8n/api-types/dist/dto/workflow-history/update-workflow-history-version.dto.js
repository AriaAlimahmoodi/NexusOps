"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkflowHistoryVersionDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class UpdateWorkflowHistoryVersionDto extends zod_class_1.Z.class({
    name: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
}) {
}
exports.UpdateWorkflowHistoryVersionDto = UpdateWorkflowHistoryVersionDto;
//# sourceMappingURL=update-workflow-history-version.dto.js.map