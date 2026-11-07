"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentPlanDocumentSchema = exports.agentPlanGroupSchema = exports.agentPlanTaskSchema = exports.AgentPlanValidationError = exports.AGENT_PLAN_FORMAT_VERSION = void 0;
exports.parseAgentPlan = parseAgentPlan;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
exports.AGENT_PLAN_FORMAT_VERSION = 1;
class AgentPlanValidationError extends n8n_workflow_1.UserError {
}
exports.AgentPlanValidationError = AgentPlanValidationError;
const idSchema = zod_1.z.string().uuid().toLowerCase();
const itemFields = {
    id: idSchema,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    status: zod_1.z.enum(['pending', 'in_progress', 'done', 'failed', 'cancelled']),
    dependsOn: zod_1.z.array(idSchema),
    resultSummary: zod_1.z.string().optional(),
    startedAt: zod_1.z.string().datetime().nullable().default(null),
    endedAt: zod_1.z.string().datetime().nullable().default(null),
};
exports.agentPlanTaskSchema = zod_1.z
    .object({ ...itemFields, kind: zod_1.z.literal('task'), fallbackFor: idSchema.optional() })
    .strict();
exports.agentPlanGroupSchema = zod_1.z
    .object({ ...itemFields, kind: zod_1.z.literal('group'), tasks: zod_1.z.array(exports.agentPlanTaskSchema) })
    .strict();
exports.agentPlanDocumentSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    presentation: zod_1.z
        .object({
        label: zod_1.z.string().trim().min(1),
        detail: zod_1.z.string().trim().min(1).optional(),
    })
        .strict()
        .optional(),
    items: zod_1.z.array(zod_1.z.discriminatedUnion('kind', [exports.agentPlanTaskSchema, exports.agentPlanGroupSchema])),
})
    .strict();
function parseAgentPlan(data, formatVersion) {
    if (formatVersion !== exports.AGENT_PLAN_FORMAT_VERSION) {
        throw new AgentPlanValidationError(`Unsupported plan format version: ${formatVersion}`);
    }
    const result = exports.agentPlanDocumentSchema.safeParse(data);
    if (!result.success) {
        throw new AgentPlanValidationError(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n'));
    }
    return result.data;
}
//# sourceMappingURL=agent-plan.schema.js.map