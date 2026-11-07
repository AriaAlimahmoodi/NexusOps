"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpandInstanceActivityTool = exports.createGetInstanceActivityTool = exports.EXPAND_INSTANCE_ACTIVITY_TOOL_NAME = exports.GET_INSTANCE_ACTIVITY_TOOL_NAME = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const MAX_RESULTS = 100;
const DEFAULT_LIMIT = 30;
exports.GET_INSTANCE_ACTIVITY_TOOL_NAME = 'get_instance_activity';
exports.EXPAND_INSTANCE_ACTIVITY_TOOL_NAME = 'expand_instance_activity';
const entrySchema = zod_1.default.object({
    id: zod_1.default.number().describe('Entry id, which expand_instance_activity takes'),
    at: zod_1.default.string().describe('ISO timestamp of the entry'),
    category: zod_1.default
        .string()
        .describe("What kind of resource the entry is about: 'workflow' or 'credential'"),
    action: zod_1.default.string().describe('What happened: created, saved, published, deleted, archived, …'),
    resourceType: zod_1.default.string().optional().describe('What resourceId points at'),
    resourceId: zod_1.default
        .string()
        .optional()
        .describe('Id of the resource, to pass to search_workflows, get_workflow_details, …'),
    resourceName: zod_1.default.string().optional().describe('Name the resource had at the time'),
    byCurrentUser: zod_1.default.boolean().describe('Whether the authenticated user is the one who did it'),
    detail: zod_1.default.record(zod_1.default.unknown()).optional().describe('Extra fields the entry carried'),
});
const listInputSchema = {
    category: zod_1.default
        .enum(['workflow', 'credential'])
        .optional()
        .describe('Restrict to one kind of entry.'),
    resourceId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Restrict to one resource, e.g. a single workflow id.'),
    beforeId: zod_1.default
        .number()
        .int()
        .optional()
        .describe('Page backwards — only entries older than this id.'),
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Read one project instead of every project you can see. Obtain it from search_projects. Read-only, so it narrows what you can already see rather than widening it.'),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
};
const listOutputSchema = {
    entries: zod_1.default.array(entrySchema).describe('Matching log entries, newest first'),
    count: zod_1.default.number().int().min(0).describe('Number of entries returned'),
    hasMore: zod_1.default
        .boolean()
        .describe('The log holds more below this page. A short or empty page can still have more below it, so do not read one as "nothing has happened" while this is true.'),
    nextBeforeId: zod_1.default
        .number()
        .int()
        .optional()
        .describe('Pass this back as beforeId to read the next page. Present whenever hasMore is true, including when this page returned no entries.'),
};
const expandInputSchema = {
    id: zod_1.default.number().int().describe('The entry id, as returned by get_instance_activity.'),
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Restrict the lookup to one project. Obtain it from search_projects.'),
};
const expandOutputSchema = {
    entry: entrySchema.optional().describe('The entry, absent when the id did not resolve'),
    resourceHistory: zod_1.default
        .array(entrySchema)
        .optional()
        .describe('Everything else the log holds about the same resource, newest first'),
    liveRecordHint: zod_1.default
        .string()
        .optional()
        .describe('The tool call that fetches the live record, when one applies'),
    notFound: zod_1.default
        .boolean()
        .optional()
        .describe('Set when the id no longer resolves. Entries are pruned on a retention window, so this is an ordinary outcome rather than an error — carry on without it.'),
};
const buildScope = (projectId, options) => ({
    surface: 'mcp',
    credentialGranted: options.credentialGranted,
    executionGranted: options.executionGranted,
    ...(projectId !== undefined ? { projectId } : {}),
});
const createGetInstanceActivityTool = (user, instanceContext, telemetry, options) => ({
    name: exports.GET_INSTANCE_ACTIVITY_TOOL_NAME,
    config: {
        description: 'Read the instance activity log — what has recently been created, changed, published, ' +
            'or deleted in this n8n instance, and who did it. Use it to pick up work already in ' +
            'progress: when the user is vague ("fix it", "carry on", "what should I look at"), the ' +
            'answer is usually the most recent thing here. Returns log entries, not live records — ' +
            'each entry carries the id to pass to search_workflows, get_workflow_details or ' +
            'get_workflow_execution. An entry may name a resource that has since been deleted. ' +
            'Check `hasMore` before concluding a short page is the whole story, and page with `nextBeforeId`.',
        inputSchema: listInputSchema,
        outputSchema: listOutputSchema,
        annotations: {
            title: 'Get Instance Activity',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ category, resourceId, beforeId, projectId, limit }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: exports.GET_INSTANCE_ACTIVITY_TOOL_NAME,
            parameters: { category, resourceId, beforeId, projectId, limit },
        };
        try {
            const { entries, hasMore, nextBeforeId } = await instanceContext.listPage({
                user,
                scope: buildScope(projectId, options),
                limit: Math.min(Math.max(1, limit ?? DEFAULT_LIMIT), MAX_RESULTS),
                ...(category !== undefined ? { category } : {}),
                ...(resourceId !== undefined ? { resourceId } : {}),
                ...(beforeId !== undefined ? { beforeId } : {}),
            });
            const payload = {
                entries,
                count: entries.length,
                hasMore,
                ...(nextBeforeId !== undefined ? { nextBeforeId } : {}),
            };
            telemetryPayload.results = { success: true, data: { count: payload.count, hasMore } };
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
exports.createGetInstanceActivityTool = createGetInstanceActivityTool;
const createExpandInstanceActivityTool = (user, instanceContext, telemetry, options) => ({
    name: exports.EXPAND_INSTANCE_ACTIVITY_TOOL_NAME,
    config: {
        description: 'Open one activity log entry by its id and get everything else the log knows about the ' +
            'same resource — how a workflow got to its current state, at a glance. Returns ' +
            '`notFound` when the id no longer resolves, which pruning makes an ordinary outcome.',
        inputSchema: expandInputSchema,
        outputSchema: expandOutputSchema,
        annotations: {
            title: 'Expand Instance Activity Entry',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ id, projectId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: exports.EXPAND_INSTANCE_ACTIVITY_TOOL_NAME,
            parameters: { id, projectId },
        };
        try {
            const expansion = await instanceContext.expand({
                id,
                user,
                scope: buildScope(projectId, options),
            });
            const payload = expansion
                ? {
                    entry: expansion.entry,
                    resourceHistory: expansion.resourceHistory,
                    ...(expansion.liveRecordHint ? { liveRecordHint: expansion.liveRecordHint } : {}),
                }
                : { notFound: true };
            telemetryPayload.results = { success: true, data: { found: expansion !== null } };
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
exports.createExpandInstanceActivityTool = createExpandInstanceActivityTool;
//# sourceMappingURL=instance-activity.tool.js.map