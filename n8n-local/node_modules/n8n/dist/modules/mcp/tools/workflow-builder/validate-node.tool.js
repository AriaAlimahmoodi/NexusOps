"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidateNodeTool = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_constants_1 = require("../../mcp.constants");
const nodeInputSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .optional()
        .describe('Optional node name. Echoed back in the result so callers can correlate.'),
    type: zod_1.default
        .string()
        .describe('Full node type, e.g. "n8n-nodes-base.set" or "@n8n/n8n-nodes-langchain.agent".'),
    typeVersion: zod_1.default.number().positive().default(1).describe('Node type version. Defaults to 1.'),
    parameters: zod_1.default
        .record(zod_1.default.unknown())
        .default({})
        .describe('Node parameters object — same shape as workflow JSON.'),
    subnodes: zod_1.default
        .unknown()
        .optional()
        .describe('Optional subnode config for AI parent nodes (e.g. langchain agent): `{ model, memory, tools: [...] }` of `{ type, version }` refs.'),
    isToolNode: zod_1.default
        .boolean()
        .optional()
        .describe('Set to true when validating a node that is wired as an AI tool subnode (ai_tool connection). Adjusts which displayOptions branch is evaluated.'),
});
const inputSchema = {
    nodes: zod_1.default
        .array(nodeInputSchema)
        .min(1)
        .max(50)
        .describe('One or more node configurations to validate independently.'),
};
const outputSchema = {
    valid: zod_1.default.boolean().describe('True when every node is valid.'),
    results: zod_1.default
        .array(zod_1.default.object({
        index: zod_1.default.number().describe('Position of this node in the input array.'),
        name: zod_1.default.string().optional().describe('Echo of the input name, if provided.'),
        type: zod_1.default.string().describe('Echo of the input node type.'),
        valid: zod_1.default.boolean().describe('Whether this node config is valid.'),
        errors: zod_1.default
            .array(zod_1.default.object({
            path: zod_1.default.string().describe('Parameter path of the error.'),
            message: zod_1.default.string().describe('Human-readable error message.'),
        }))
            .optional()
            .describe('Validation errors for this node (omitted when valid).'),
    }))
        .describe('Per-node validation results, in input order.'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Top-level error message when validation could not run at all (e.g. internal failure loading the schema). Omitted on success.'),
};
const createValidateNodeTool = (user, telemetry) => ({
    name: constants_1.CODE_BUILDER_VALIDATE_NODE_TOOL.toolName,
    config: {
        description: "Validate a node's config the moment you write it — before assembling create_workflow_from_code or calling update_workflow. Read-only and needs no existing workflow, so use it freely while composing. Unlike the write tools (which validate only as they mutate), this returns isolated per-node, per-parameter errors with no graph noise, and can check several candidate configs in one call so you wire only the one that passes. For langchain tool subnodes (nodes wired via ai_tool), set isToolNode: true so the schema evaluates the correct displayOptions branch. Schema-level only — for connections, required inputs, triggers, and credentials use validate_workflow.",
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.CODE_BUILDER_VALIDATE_NODE_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ nodes }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.CODE_BUILDER_VALIDATE_NODE_TOOL.toolName,
            parameters: { nodeCount: nodes.length },
        };
        try {
            const { validateNodeConfig } = await import('@n8n/workflow-sdk');
            const results = nodes.map((node, index) => {
                const result = validateNodeConfig(node.type, node.typeVersion, { parameters: node.parameters, subnodes: node.subnodes }, { isToolNode: node.isToolNode });
                return {
                    index,
                    ...(node.name !== undefined ? { name: node.name } : {}),
                    type: node.type,
                    valid: result.valid,
                    ...(result.valid ? {} : { errors: result.errors }),
                };
            });
            const valid = results.every((r) => r.valid);
            const invalidCount = results.filter((r) => !r.valid).length;
            const errorCount = results.reduce((sum, r) => sum + (r.errors?.length ?? 0), 0);
            telemetryPayload.results = {
                success: true,
                data: { invalidCount, errorCount },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const response = { valid, results };
            return {
                content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
                structuredContent: response,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            telemetryPayload.results = {
                success: false,
                error: errorMessage,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                valid: false,
                results: [],
                error: errorMessage,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createValidateNodeTool = createValidateNodeTool;
//# sourceMappingURL=validate-node.tool.js.map