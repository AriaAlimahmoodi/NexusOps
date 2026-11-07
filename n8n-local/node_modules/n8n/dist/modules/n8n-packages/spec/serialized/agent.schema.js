"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedAgentMetadataSchema = exports.serializedAgentSchema = exports.serializedAgentTaskSchema = exports.serializedAgentToolSchema = void 0;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const zod_1 = require("zod");
const skillIdSchema = api_types_1.AgentJsonConfigBaseSchema.shape.skills.unwrap().innerType().element.shape.id;
const taskIdSchema = api_types_1.AgentJsonConfigBaseSchema.shape.tasks
    .unwrap()
    .element.shape.id.max(api_types_1.AGENT_TASK_ID_MAX_LENGTH);
const customToolIdSchema = zod_1.z.string().min(1).regex(api_types_1.CUSTOM_TOOL_ID_REGEX);
const toolDescriptorSchema = zod_1.z
    .object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    systemInstruction: zod_1.z.string().nullable(),
    inputSchema: zod_1.z.custom(is_record_1.isRecord).nullable(),
    outputSchema: zod_1.z.custom(is_record_1.isRecord).nullable(),
    hasSuspend: zod_1.z.boolean(),
    hasResume: zod_1.z.boolean(),
    hasToMessage: zod_1.z.boolean(),
    requireApproval: zod_1.z.boolean(),
    outputTrust: zod_1.z.literal('untrusted').nullish(),
    providerOptions: zod_1.z.record(zod_1.z.unknown()).nullable(),
})
    .strict();
exports.serializedAgentToolSchema = zod_1.z
    .object({
    code: zod_1.z.string(),
    descriptor: toolDescriptorSchema,
})
    .strict();
exports.serializedAgentTaskSchema = api_types_1.agentTaskSchema
    .extend({
    timezone: api_types_1.agentTaskSchema.shape.timezone.default(null),
})
    .strict();
exports.serializedAgentSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(128),
    config: api_types_1.AgentJsonConfigSchema.nullable(),
    availableInMCP: zod_1.z.boolean(),
    skills: zod_1.z.record(skillIdSchema, api_types_1.agentSkillSchema),
    tools: zod_1.z.record(customToolIdSchema, exports.serializedAgentToolSchema),
    tasks: zod_1.z.record(taskIdSchema, exports.serializedAgentTaskSchema),
})
    .strict();
exports.serializedAgentMetadataSchema = zod_1.z
    .object({
    versionId: zod_1.z.string().min(1).nullable(),
    publishedVersionId: zod_1.z.string().min(1).nullable(),
})
    .strict();
//# sourceMappingURL=agent.schema.js.map