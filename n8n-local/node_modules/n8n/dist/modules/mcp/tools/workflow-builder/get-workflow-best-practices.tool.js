"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowBestPracticesTool = void 0;
const best_practices_1 = require("@n8n/workflow-sdk/prompts/best-practices");
const sdk_reference_1 = require("@n8n/workflow-sdk/prompts/sdk-reference");
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_constants_1 = require("../../mcp.constants");
const tool_error_utils_1 = require("../tool-error.utils");
const LIST_SENTINEL = 'list';
const TECHNIQUE_CHOICES = [LIST_SENTINEL, ...Object.values(best_practices_1.WorkflowTechnique)];
const inputSchema = {
    technique: zod_1.default
        .enum(TECHNIQUE_CHOICES)
        .describe(`Workflow technique key to fetch best-practices guidance for. Pass "${LIST_SENTINEL}" to discover all available techniques. One of: ${TECHNIQUE_CHOICES.join(', ')}.`),
};
const availableTechniqueSchema = zod_1.default.object({
    technique: zod_1.default.string(),
    description: zod_1.default.string(),
    hasDocumentation: zod_1.default.boolean(),
});
const outputSchema = {
    technique: zod_1.default
        .string()
        .describe('The requested technique key, or "list" when listing all available techniques.'),
    message: zod_1.default.string().describe('Human-readable summary of the response.'),
    documentation: zod_1.default
        .string()
        .optional()
        .describe('Best-practices documentation for the requested technique, when one with documentation was requested.'),
    availableTechniques: zod_1.default
        .array(availableTechniqueSchema)
        .optional()
        .describe('All available techniques, returned when "list" was requested.'),
};
function buildListResponse() {
    const availableTechniques = Object.entries(best_practices_1.TechniqueDescription).map(([key, description]) => ({
        technique: key,
        description,
        hasDocumentation: best_practices_1.bestPracticesRegistry[key] !== undefined,
    }));
    const documentedCount = availableTechniques.filter((t) => t.hasDocumentation).length;
    const message = `Found ${availableTechniques.length} workflow techniques. ${documentedCount} have detailed best-practices documentation. Call this tool again with a specific technique key to fetch its guidance.`;
    const text = [
        message,
        '',
        ...availableTechniques.map((t) => `- ${t.technique}${t.hasDocumentation ? '' : ' (no detailed documentation yet)'} — ${t.description}`),
        '',
        sdk_reference_1.GROUPING_GUIDANCE,
    ].join('\n');
    return {
        text,
        hasDocumentation: false,
        structured: {
            technique: LIST_SENTINEL,
            message,
            availableTechniques,
        },
    };
}
function buildTechniqueResponse(technique) {
    const doc = best_practices_1.bestPracticesRegistry[technique];
    if (doc) {
        const documentation = doc.getDocumentation();
        return {
            text: documentation,
            hasDocumentation: true,
            structured: {
                technique,
                message: `Best-practices documentation for "${technique}" retrieved.`,
                documentation,
            },
        };
    }
    const description = best_practices_1.TechniqueDescription[technique];
    const message = `Technique "${technique}" (${description}) does not have detailed best-practices documentation yet — proceed with general n8n knowledge.`;
    return { text: message, hasDocumentation: false, structured: { technique, message } };
}
const createGetWorkflowBestPracticesTool = (user, telemetry) => ({
    name: constants_1.MCP_GET_WORKFLOW_BEST_PRACTICES_TOOL.toolName,
    config: {
        description: 'Required planning step when building a workflow, and only then. Get best-practices guidance (recommended nodes, patterns, and common pitfalls) for a specific workflow technique before searching for nodes or writing code. Call once per relevant technique. Use technique="list" first if unsure which techniques apply.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.MCP_GET_WORKFLOW_BEST_PRACTICES_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ technique }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.MCP_GET_WORKFLOW_BEST_PRACTICES_TOOL.toolName,
            parameters: { technique },
        };
        try {
            const response = technique === LIST_SENTINEL ? buildListResponse() : buildTechniqueResponse(technique);
            telemetryPayload.results = {
                success: true,
                data: {
                    technique,
                    hasDocumentation: response.hasDocumentation,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: response.text }],
                structuredContent: response.structured,
            };
        }
        catch (error) {
            (0, tool_error_utils_1.trackAndRethrowToolError)(telemetry, telemetryPayload, error);
        }
    },
});
exports.createGetWorkflowBestPracticesTool = createGetWorkflowBestPracticesTool;
//# sourceMappingURL=get-workflow-best-practices.tool.js.map