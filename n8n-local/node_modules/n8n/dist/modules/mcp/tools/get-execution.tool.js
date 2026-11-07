"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetExecutionTool = void 0;
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const execution_persistence_1 = require("../../../executions/execution-persistence");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow the execution belongs to'),
    executionId: zod_1.default.string().describe('The ID of the execution to retrieve'),
    includeData: zod_1.default
        .boolean()
        .optional()
        .describe('Whether to include the full execution result data. Defaults to false (metadata only). Set to true to include node inputs/outputs. Use `false` to quickly check execution status'),
    nodeNames: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe('When includeData is true, return data only for these node names. If omitted, data for all nodes is included.'),
    truncateData: zod_1.default
        .number()
        .int()
        .positive()
        .optional()
        .describe('When includeData is true, limit the number of data items returned per node output to this value. If omitted, all items are returned.'),
});
const outputSchema = {
    execution: zod_1.default
        .object({
        id: zod_1.default.string(),
        workflowId: zod_1.default.string(),
        mode: zod_1.default.string(),
        status: zod_1.default.string(),
        startedAt: zod_1.default.string().nullable(),
        stoppedAt: zod_1.default.string().nullable(),
        retryOf: zod_1.default.string().nullable().optional(),
        retrySuccessId: zod_1.default.string().nullable().optional(),
        waitTill: zod_1.default.string().nullable().optional(),
    })
        .passthrough()
        .nullable()
        .describe('Execution metadata, or null if an error occurred'),
    data: zod_1.default
        .unknown()
        .optional()
        .describe('Execution result data (only present when includeData is true)'),
    error: zod_1.default.string().optional().describe('Error message if the request failed'),
};
const createGetExecutionTool = (user, executionRepository, workflowFinderService, telemetry, executionRedactionServiceProxy) => ({
    name: 'get_workflow_execution',
    config: {
        description: 'Get workflow execution details by execution ID and workflow ID. By default returns metadata only. Set includeData to true to include node execution data, optionally filtered by nodeNames and truncated by truncateData.',
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Get Workflow Execution',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, executionId, includeData, nodeNames, truncateData, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'get_workflow_execution',
            parameters: { workflowId, executionId, includeData, nodeNames, truncateData },
        };
        try {
            await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read', 'execution:read'], workflowFinderService);
            let execution;
            let executionData;
            if (includeData) {
                const fullExecution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findWithUnflattenedData(executionId, [workflowId]);
                if (fullExecution) {
                    await executionRedactionServiceProxy.processExecution(fullExecution, { user });
                }
                execution = fullExecution;
                executionData = fullExecution?.data ?? null;
            }
            else {
                execution = await executionRepository.findIfAccessible(executionId, [workflowId]);
            }
            if (!execution) {
                throw new mcp_errors_1.WorkflowAccessError(`Execution '${executionId}' not found for workflow '${workflowId}'`, 'execution_not_found');
            }
            const executionMeta = {
                id: execution.id,
                workflowId: execution.workflowId,
                mode: execution.mode,
                status: execution.status,
                startedAt: execution.startedAt?.toISOString() ?? null,
                stoppedAt: execution.stoppedAt?.toISOString() ?? null,
                retryOf: execution.retryOf ?? null,
                retrySuccessId: execution.retrySuccessId ?? null,
                waitTill: execution.waitTill?.toISOString() ?? null,
            };
            let filteredData;
            if (executionData) {
                filteredData = executionData;
                if (nodeNames !== undefined || truncateData) {
                    filteredData = filterExecutionData(filteredData, nodeNames, truncateData);
                }
            }
            else if (executionData === null) {
                filteredData = null;
            }
            const output = filteredData !== undefined
                ? { execution: executionMeta, data: filteredData }
                : { execution: executionMeta };
            telemetryPayload.results = {
                success: true,
                data: {
                    executionId,
                    status: execution.status,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const safeOutput = (0, n8n_workflow_1.replaceCircularReferences)(output);
            return {
                content: [{ type: 'text', text: JSON.stringify(safeOutput) }],
                structuredContent: safeOutput,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const errorInfo = {
                message: error.message || 'Unknown error',
                name: error.constructor.name,
            };
            if ('extra' in error && error.extra) {
                errorInfo.extra = error.extra;
            }
            if (error.cause) {
                errorInfo.cause =
                    error.cause instanceof Error ? error.cause.message : (0, n8n_workflow_1.jsonStringify)(error.cause);
            }
            const output = {
                execution: null,
                error: error.message ?? `${error.constructor.name}: (no message)`,
            };
            telemetryPayload.results = {
                success: false,
                error: errorInfo,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const safeOutput = (0, n8n_workflow_1.replaceCircularReferences)(output);
            return {
                content: [{ type: 'text', text: JSON.stringify(safeOutput) }],
                structuredContent: safeOutput,
            };
        }
    },
});
exports.createGetExecutionTool = createGetExecutionTool;
function filterExecutionData(data, nodeNames, truncateData) {
    const filtered = { ...data, resultData: { ...data.resultData } };
    let runData = filtered.resultData.runData ?? {};
    if (nodeNames !== undefined) {
        const filteredRunData = {};
        for (const name of nodeNames) {
            if (name in runData) {
                filteredRunData[name] = runData[name];
            }
        }
        runData = filteredRunData;
        if (filtered.resultData.pinData) {
            const filteredPinData = {};
            for (const name of nodeNames) {
                if (name in filtered.resultData.pinData) {
                    filteredPinData[name] = filtered.resultData.pinData[name];
                }
            }
            filtered.resultData.pinData = filteredPinData;
        }
    }
    if (truncateData) {
        const truncated = {};
        for (const [nodeName, taskDataArray] of Object.entries(runData)) {
            truncated[nodeName] = taskDataArray.map((taskData) => {
                if (!taskData.data)
                    return taskData;
                const truncatedConnections = {};
                for (const [connType, outputs] of Object.entries(taskData.data)) {
                    truncatedConnections[connType] = outputs.map((items) => items ? items.slice(0, truncateData) : items);
                }
                return { ...taskData, data: truncatedConnections };
            });
        }
        runData = truncated;
    }
    filtered.resultData.runData = runData;
    return filtered;
}
//# sourceMappingURL=get-execution.tool.js.map