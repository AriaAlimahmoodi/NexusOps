"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkflowsAvailabilityDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
class UpdateWorkflowsAvailabilityDto extends api_types_1.Z.class({
    availableInMCP: zod_1.z.boolean(),
    workflowIds: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(100).optional(),
    projectId: zod_1.z.string().min(1).optional(),
    folderId: zod_1.z.string().min(1).optional(),
    allWorkflows: zod_1.z.literal(true).optional(),
}) {
}
exports.UpdateWorkflowsAvailabilityDto = UpdateWorkflowsAvailabilityDto;
//# sourceMappingURL=update-workflows-availability.dto.js.map