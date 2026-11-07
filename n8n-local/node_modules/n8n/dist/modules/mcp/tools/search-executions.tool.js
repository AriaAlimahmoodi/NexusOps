"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchExecutionsTool = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const execution_cursor_1 = require("../../../executions/execution-cursor");
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const schemas_1 = require("./schemas");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const MAX_RESULTS = 200;
const inputSchema = {
    workflowId: zod_1.default.string().optional().describe('Filter executions by workflow ID'),
    status: zod_1.default
        .array(zod_1.default.enum(n8n_workflow_1.ExecutionStatusList))
        .optional()
        .describe('Filter by execution status(es)'),
    startedAfter: zod_1.default
        .string()
        .datetime({ offset: true })
        .optional()
        .describe('ISO 8601 timestamp — only return executions that started after this time'),
    startedBefore: zod_1.default
        .string()
        .datetime({ offset: true })
        .optional()
        .describe('ISO 8601 timestamp — only return executions that started before this time'),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
    cursor: zod_1.default
        .string()
        .optional()
        .describe('Cursor for pagination — pass the `nextCursor` from the previous page. Treat it as opaque'),
};
const outputSchema = {
    data: zod_1.default
        .array(zod_1.default.object({
        id: zod_1.default.string().describe('The unique identifier of the execution'),
        workflowId: zod_1.default.string().describe('The workflow this execution belongs to'),
        status: zod_1.default.enum(n8n_workflow_1.ExecutionStatusList).describe('The execution status'),
        mode: zod_1.default.enum(n8n_workflow_1.WorkflowExecuteModeList).describe('How the execution was triggered'),
        startedAt: zod_1.default.string().nullable().describe('ISO timestamp when the execution started'),
        stoppedAt: zod_1.default.string().nullable().describe('ISO timestamp when the execution stopped'),
        waitTill: zod_1.default
            .string()
            .nullable()
            .describe('ISO timestamp until when the execution is waiting'),
    }))
        .describe('List of executions matching the query'),
    count: zod_1.default
        .union([zod_1.default.literal(-1), zod_1.default.number().int().min(0)])
        .describe('Total matching executions, or -1 if the count is unavailable'),
    estimated: zod_1.default.boolean().describe('Whether the count is an estimate (for large datasets)'),
    nextCursor: zod_1.default
        .string()
        .nullable()
        .describe('Cursor for the next page, or null when there is no next page'),
    error: zod_1.default.string().optional().describe('Error message if the query failed'),
};
const createSearchExecutionsTool = (user, executionListService, workflowFinderService, telemetry) => ({
    name: 'search_workflow_executions',
    config: {
        description: 'Search for workflow executions with optional filters. Returns execution metadata including status, timing, and workflow ID.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Search Workflow Executions',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, status, startedAfter, startedBefore, limit = MAX_RESULTS, cursor, }) => {
        const parameters = { workflowId, status, startedAfter, startedBefore, limit, cursor };
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'search_workflow_executions',
            parameters,
        };
        try {
            if (workflowId) {
                await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read', 'execution:read'], workflowFinderService);
            }
            const safeLimit = Math.min(Math.max(1, limit), MAX_RESULTS);
            const sharingOptions = await executionListService.buildSharingOptions('execution:read');
            const parsedCursor = (0, execution_cursor_1.parseExecutionCursor)(cursor);
            const query = {
                kind: 'range',
                user,
                sharingOptions,
                range: { limit: safeLimit },
                ...(workflowId ? { workflowId } : {}),
                ...(status?.length ? { status } : {}),
                ...(startedAfter ? { startedAfter } : {}),
                ...(startedBefore ? { startedBefore } : {}),
                isArchived: false,
                workflowBooleanSettings: [{ key: 'availableInMCP', value: true }],
            };
            const { results, count, estimated, nextCursor } = await executionListService.findPageWithCount(query, parsedCursor);
            const data = results.map((execution) => ({
                id: execution.id,
                workflowId: execution.workflowId,
                status: execution.status,
                mode: execution.mode,
                startedAt: execution.startedAt ?? null,
                stoppedAt: execution.stoppedAt ?? null,
                waitTill: execution.waitTill ?? null,
            }));
            const payload = { data, count, estimated, nextCursor };
            telemetryPayload.results = {
                success: true,
                data: { count, estimated },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                structuredContent: payload,
                content: [{ type: 'text', text: JSON.stringify(payload) }],
            };
        }
        catch (er) {
            const error = er instanceof Error ? er : new Error(String(er));
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            telemetryPayload.results = {
                success: false,
                error: error.message,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                data: [],
                count: 0,
                estimated: false,
                nextCursor: null,
                error: error.message,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createSearchExecutionsTool = createSearchExecutionsTool;
//# sourceMappingURL=search-executions.tool.js.map