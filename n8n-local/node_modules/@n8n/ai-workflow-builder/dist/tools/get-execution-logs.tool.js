"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_EXECUTION_LOGS_TOOL = void 0;
exports.createGetExecutionLogsTool = createGetExecutionLogsTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const truncate_json_1 = require("../utils/truncate-json");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const DISPLAY_TITLE = 'Getting execution logs';
const getExecutionLogsSchema = zod_1.z.object({
    nodeName: zod_1.z
        .string()
        .optional()
        .describe('Optional: Filter to get execution logs for a specific node only'),
});
function formatExecutionLogs(runData, error, lastNodeExecuted, nodeName) {
    const parts = [];
    if (error) {
        parts.push('<execution_error>');
        if (lastNodeExecuted) {
            parts.push(`  <last_node_executed>${lastNodeExecuted}</last_node_executed>`);
        }
        parts.push('  <error_details>');
        parts.push((0, truncate_json_1.truncateJson)(error));
        parts.push('  </error_details>');
        parts.push('</execution_error>');
    }
    if (runData && Object.keys(runData).length > 0) {
        parts.push('<execution_run_data>');
        const filtered = nodeName
            ? Object.fromEntries(Object.entries(runData).filter(([key]) => key === nodeName))
            : runData;
        if (Object.keys(filtered).length > 0) {
            parts.push((0, truncate_json_1.truncateJson)(filtered));
        }
        else if (nodeName) {
            parts.push(`No execution data found for node "${nodeName}"`);
        }
        parts.push('</execution_run_data>');
    }
    if (parts.length === 0) {
        return nodeName
            ? `No execution logs found for node "${nodeName}"`
            : 'No execution logs available. The workflow may not have been executed yet.';
    }
    return parts.join('\n');
}
exports.GET_EXECUTION_LOGS_TOOL = {
    toolName: 'get_execution_logs',
    displayTitle: DISPLAY_TITLE,
};
function createGetExecutionLogsTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_EXECUTION_LOGS_TOOL.toolName, DISPLAY_TITLE);
        try {
            const validatedInput = getExecutionLogsSchema.parse(input);
            const { nodeName } = validatedInput;
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const executionData = state.workflowContext?.executionData;
            const runData = executionData?.runData;
            const error = executionData?.error;
            const lastNodeExecuted = executionData?.lastNodeExecuted;
            logger?.debug(`Getting execution logs${nodeName ? ` for node ${nodeName}` : ''}, hasError: ${!!error}, runData nodes: ${runData ? Object.keys(runData).length : 0}`);
            const formattedLogs = formatExecutionLogs(runData, error, lastNodeExecuted, nodeName);
            const nodeCount = runData ? Object.keys(runData).length : 0;
            const output = {
                hasError: !!error,
                lastNodeExecuted,
                nodesWithData: nodeCount,
                message: nodeCount > 0 || error ? 'Execution logs retrieved' : 'No execution logs available',
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, formattedLogs);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid input parameters', {
                    extra: { errors: error.errors },
                });
                reporter.error(validationError);
                return (0, response_1.createErrorResponse)(config, validationError);
            }
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Unknown error occurred', {
                toolName: exports.GET_EXECUTION_LOGS_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_EXECUTION_LOGS_TOOL.toolName,
        description: 'Get the execution logs including run data and error information from the last workflow execution. Use this to debug workflow errors or understand execution results.',
        schema: getExecutionLogsSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_EXECUTION_LOGS_TOOL,
    };
}
//# sourceMappingURL=get-execution-logs.tool.js.map