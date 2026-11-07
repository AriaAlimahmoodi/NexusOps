"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionStatusSchema = void 0;
const zod_1 = require("zod");
exports.WorkflowExecutionStatusSchema = zod_1.z.object({
    workflowId: zod_1.z.string(),
    credentials: zod_1.z
        .array(zod_1.z.object({
        credentialId: zod_1.z.string(),
        credentialName: zod_1.z.string(),
        credentialType: zod_1.z.string(),
        credentialStatus: zod_1.z.enum(['missing', 'configured', 'resolver_missing']),
        authorizationUrl: zod_1.z.string().optional(),
        revokeUrl: zod_1.z.string().optional(),
    }))
        .optional(),
    readyToExecute: zod_1.z.boolean(),
});
//# sourceMappingURL=workflow-execution-status.schema.js.map