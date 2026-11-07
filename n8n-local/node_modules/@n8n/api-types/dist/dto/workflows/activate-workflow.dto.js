"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateWorkflowDto = void 0;
const zod_1 = require("zod");
const workflow_version_schema_1 = require("../../schemas/workflow-version.schema");
const zod_class_1 = require("../../zod-class");
class ActivateWorkflowDto extends zod_class_1.Z.class({
    versionId: zod_1.z.string(),
    name: workflow_version_schema_1.workflowVersionNameSchema,
    description: workflow_version_schema_1.workflowVersionDescriptionSchema,
    expectedChecksum: zod_1.z.string().optional(),
}) {
}
exports.ActivateWorkflowDto = ActivateWorkflowDto;
//# sourceMappingURL=activate-workflow.dto.js.map