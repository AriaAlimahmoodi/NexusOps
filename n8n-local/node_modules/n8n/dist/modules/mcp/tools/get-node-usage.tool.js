"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetNodeUsageTool = exports.GET_NODE_USAGE_TOOL_NAME = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const MAX_RESULTS = 100;
exports.GET_NODE_USAGE_TOOL_NAME = 'get_node_usage';
const inputSchema = {
    nodeType: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Fully qualified node type, e.g. "n8n-nodes-base.httpRequest". Given one, returns the workflows using it. Omitted, returns the histogram of every node type in use.'),
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Read one project instead of every workflow you can see. Obtain it from search_projects.'),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
};
const outputSchema = {
    workflowsInScope: zod_1.default
        .number()
        .int()
        .min(0)
        .describe('Indexed, non-archived workflows the counts are drawn from — the denominator. A count means nothing without it.'),
    nodeTypes: zod_1.default
        .array(zod_1.default.object({
        nodeType: zod_1.default.string().describe('Fully qualified node type'),
        workflowCount: zod_1.default.number().int().min(0).describe('Workflows in scope using it'),
    }))
        .optional()
        .describe('The histogram, returned when no nodeType was named. Most used first.'),
    workflows: zod_1.default
        .array(zod_1.default.object({
        workflowId: zod_1.default.string(),
        name: zod_1.default.string(),
        updatedAt: zod_1.default.string().describe('ISO timestamp of the last change'),
    }))
        .optional()
        .describe('Workflows using the named nodeType, returned when one was given.'),
    truncated: zod_1.default
        .boolean()
        .optional()
        .describe('The limit cut the list short. On the histogram this also means an absent node type may be in use but unshown, so do not report absence as evidence when it is set.'),
};
const createGetNodeUsageTool = (user, workflowDependencyQueryService, telemetry) => ({
    name: exports.GET_NODE_USAGE_TOOL_NAME,
    config: {
        description: 'Which node types this instance already uses, and how widely. Call it before choosing ' +
            'between equivalent nodes so a new workflow matches how this instance already builds — ' +
            'for example whether HTTP Request or a dedicated integration node is the local habit. ' +
            'Without nodeType it returns the histogram of node types in use; with one, the ' +
            'workflows using it. Counts come with the denominator they are counted against. ' +
            'Counts of node types only — never parameter values or credentials.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get Node Usage',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ nodeType, projectId, limit }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: exports.GET_NODE_USAGE_TOOL_NAME,
            parameters: { nodeType, projectId, limit },
        };
        try {
            const usage = await workflowDependencyQueryService.getNodeTypeUsage(user, {
                ...(nodeType !== undefined ? { nodeType } : {}),
                ...(projectId !== undefined ? { projectId } : {}),
                ...(limit !== undefined ? { limit: Math.min(Math.max(1, limit), MAX_RESULTS) } : {}),
            });
            const payload = {
                workflowsInScope: usage.workflowsInScope,
                ...(usage.nodeTypes ? { nodeTypes: usage.nodeTypes } : {}),
                ...(usage.workflows
                    ? {
                        workflows: usage.workflows.map((workflow) => ({
                            workflowId: workflow.workflowId,
                            name: workflow.name,
                            updatedAt: workflow.updatedAt.toISOString(),
                        })),
                    }
                    : {}),
                ...(usage.truncated ? { truncated: true } : {}),
            };
            telemetryPayload.results = {
                success: true,
                data: { workflowsInScope: payload.workflowsInScope },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        catch (error) {
            telemetryPayload.results = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            throw error;
        }
    },
});
exports.createGetNodeUsageTool = createGetNodeUsageTool;
//# sourceMappingURL=get-node-usage.tool.js.map