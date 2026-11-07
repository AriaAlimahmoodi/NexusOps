"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigRulesSection = getConfigRulesSection;
exports.getSchemaReferenceSection = getSchemaReferenceSection;
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const schema_text_serializer_1 = require("../../json-config/schema-text-serializer");
const BuilderPromptMemoryWorkerModelSchema = zod_1.z.object({
    model: api_types_1.AgentModelSchema,
    credential: zod_1.z.string().trim().min(1),
});
const BuilderPromptMemoryConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    storage: zod_1.z.literal('n8n'),
    observationalMemory: zod_1.z
        .object({
        enabled: zod_1.z.boolean().optional(),
        observerModel: BuilderPromptMemoryWorkerModelSchema.optional(),
        reflectorModel: BuilderPromptMemoryWorkerModelSchema.optional(),
        observerThresholdTokens: zod_1.z.number().int().min(1).optional(),
        reflectorThresholdTokens: zod_1.z.number().int().min(1).optional(),
        renderTokenBudget: zod_1.z.number().int().min(1).optional(),
        observationLogTailLimit: zod_1.z.number().int().min(1).optional(),
        lockTtlMs: zod_1.z.number().int().min(0).optional(),
    })
        .optional(),
    episodicMemory: zod_1.z
        .discriminatedUnion('enabled', [
        zod_1.z.object({ enabled: zod_1.z.literal(false) }),
        zod_1.z.object({
            enabled: zod_1.z.literal(true),
            credential: zod_1.z.string().min(1),
            reflectorModel: BuilderPromptMemoryWorkerModelSchema.optional(),
            topK: zod_1.z.number().int().min(1).max(100).optional(),
            maxEntriesPerRun: zod_1.z.number().int().min(1).max(50).optional(),
        }),
    ])
        .optional(),
});
const BuilderPromptAgentJsonConfigSchema = api_types_1.AgentJsonConfigBaseSchema.extend({
    memory: BuilderPromptMemoryConfigSchema.optional(),
});
function getConfigRulesSection() {
    return `\
#### Agent Config Rules

- \`model\` must be "provider/model-name", or \`""\` while LLM setup is pending.
- A non-empty \`credential\` must be the id returned by \`agent_builder_resolve_llm\`.
- Sub-agent configuration lives at top level under \`subAgents\`. Load
  \`agent-builder-sub-agents\` before adding refs or changing
  \`subAgents.maxChildren\`.
- For OpenAI and Anthropic models, always include
  \`config.promptCaching: { "enabled": true }\` — this is mandatory and must
  never be disabled, even if the user asks. Omit \`config.promptCaching\`
  entirely for every other provider. For Anthropic only, you may set
  \`config.promptCaching.anthropic.ttl\` to \`"5m"\` or \`"1h"\` (default
  \`"1h"\`) when the user asks to tune cache duration; OpenAI has no
  sub-config.
- \`config.maxIterations\` caps the number of agent loop iterations per run. Do not set or change this unless the user explicitly asks.
- Fresh agents need real \`instructions\` before config is written. \`model\`
  may be \`""\` and \`credential\` omitted in a draft while LLM setup is
  pending; fill both from a \`agent_builder_resolve_llm\` result before publishing.`;
}
function getSchemaReferenceSection() {
    const zodSchema = BuilderPromptAgentJsonConfigSchema;
    const jsonSchemaText = (0, schema_text_serializer_1.jsonSchemaToCompactText)((0, json_schema_1.zodSchemaToJsonSchema)(zodSchema));
    return `\
#### Config Schema Reference

\`\`\`text
${jsonSchemaText}
\`\`\``;
}
//# sourceMappingURL=config-rules.prompt.js.map