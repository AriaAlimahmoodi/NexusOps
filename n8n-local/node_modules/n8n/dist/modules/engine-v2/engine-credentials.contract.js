"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialRequestSchema = void 0;
exports.isResolveCredentialResponse = isResolveCredentialResponse;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
exports.resolveCredentialRequestSchema = zod_1.z.object({
    credential: zod_1.z.object({
        id: zod_1.z.string().min(1),
        name: zod_1.z.string().min(1),
        type: zod_1.z.string().min(1),
    }),
    execution: zod_1.z.object({
        executionId: zod_1.z.string().min(1),
        workflowId: zod_1.z.string().min(1),
        mode: zod_1.z.enum(n8n_workflow_1.WorkflowExecuteModeList),
    }),
    context: zod_1.z.object({
        userId: zod_1.z.string().min(1).optional(),
        projectId: zod_1.z.string().min(1).optional(),
    }),
    consumer: zod_1.z.object({
        nodeType: zod_1.z.string().min(1),
    }),
});
function isResolveCredentialResponse(body) {
    if (typeof body !== 'object' || body === null || !('data' in body))
        return false;
    const { data } = body;
    return typeof data === 'object' && data !== null && !Array.isArray(data);
}
//# sourceMappingURL=engine-credentials.contract.js.map