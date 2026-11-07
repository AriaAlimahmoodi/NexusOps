"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowHistoryVersionsByIdsDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class WorkflowHistoryVersionsByIdsDto extends zod_class_1.Z.class({
    versionIds: zod_1.z.array(zod_1.z.string()),
}) {
}
exports.WorkflowHistoryVersionsByIdsDto = WorkflowHistoryVersionsByIdsDto;
//# sourceMappingURL=workflow-history-versions-by-ids.dto.js.map