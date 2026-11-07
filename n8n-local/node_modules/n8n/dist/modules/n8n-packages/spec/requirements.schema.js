"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageRequirementsSchema = exports.packageVariableRequirementSchema = exports.packageNodeTypeRequirementSchema = exports.packageTagRequirementSchema = exports.packageAgentRequirementSchema = exports.packageWorkflowRequirementSchema = exports.packageDataTableRequirementSchema = exports.packageCredentialRequirementSchema = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const requirementUsage = {
    usedBy: zod_1.z.array(api_types_1.packageRequirementConsumerSchema).min(1),
};
exports.packageCredentialRequirementSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.string().min(1).optional(),
    ...requirementUsage,
})
    .superRefine((credential, ctx) => {
    if (!credential.usedBy.some(({ kind }) => kind === 'workflow'))
        return;
    for (const field of ['name', 'type']) {
        if (credential[field] === undefined) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: [field],
                message: `Credential ${field} is required for workflow consumers`,
            });
        }
    }
});
exports.packageDataTableRequirementSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    ...requirementUsage,
});
exports.packageWorkflowRequirementSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).optional(),
    ...requirementUsage,
});
exports.packageAgentRequirementSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).optional(),
    ...requirementUsage,
});
exports.packageTagRequirementSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    usedBy: zod_1.z.array(api_types_1.packageRequirementConsumerSchema.extend({ kind: zod_1.z.literal('workflow') })).min(1),
});
exports.packageNodeTypeRequirementSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    typeVersion: zod_1.z.number().finite(),
    ...requirementUsage,
});
exports.packageVariableRequirementSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    ...requirementUsage,
});
function assertNoDuplicateKey(entries, keyOf, label, ctx) {
    if (!entries)
        return;
    const seen = new Set();
    for (const entry of entries) {
        const key = keyOf(entry);
        if (seen.has(key)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `Duplicate ${label}: ${key}`,
            });
        }
        seen.add(key);
    }
}
exports.packageRequirementsSchema = zod_1.z.object({
    credentials: zod_1.z
        .array(exports.packageCredentialRequirementSchema)
        .optional()
        .superRefine((credentials, ctx) => assertNoDuplicateKey(credentials, ({ id }) => id, 'credential id', ctx)),
    dataTables: zod_1.z
        .array(exports.packageDataTableRequirementSchema)
        .optional()
        .superRefine((dataTables, ctx) => assertNoDuplicateKey(dataTables, ({ id }) => id, 'data table id', ctx)),
    workflows: zod_1.z
        .array(exports.packageWorkflowRequirementSchema)
        .optional()
        .superRefine((workflows, ctx) => assertNoDuplicateKey(workflows, ({ id }) => id, 'workflow id', ctx)),
    agents: zod_1.z
        .array(exports.packageAgentRequirementSchema)
        .optional()
        .superRefine((agents, ctx) => assertNoDuplicateKey(agents, ({ id }) => id, 'Agent id', ctx)),
    variables: zod_1.z
        .array(exports.packageVariableRequirementSchema)
        .optional()
        .superRefine((variables, ctx) => assertNoDuplicateKey(variables, ({ name }) => name, 'variable name', ctx)),
    tags: zod_1.z
        .array(exports.packageTagRequirementSchema)
        .optional()
        .superRefine((tags, ctx) => assertNoDuplicateKey(tags, ({ id }) => id, 'tag id', ctx)),
    nodeTypes: zod_1.z
        .array(exports.packageNodeTypeRequirementSchema)
        .optional()
        .superRefine((nodeTypes, ctx) => assertNoDuplicateKey(nodeTypes, ({ type, typeVersion }) => `${type}@${typeVersion}`, 'node type', ctx)),
});
//# sourceMappingURL=requirements.schema.js.map