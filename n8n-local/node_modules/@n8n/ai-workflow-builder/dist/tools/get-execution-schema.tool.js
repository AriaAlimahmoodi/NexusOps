"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_EXECUTION_SCHEMA_TOOL = void 0;
exports.createGetExecutionSchemaTool = createGetExecutionSchemaTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const truncate_json_1 = require("../utils/truncate-json");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const DISPLAY_TITLE = 'Getting execution schema';
const getExecutionSchemaSchema = zod_1.z.object({
    nodeName: zod_1.z
        .string()
        .optional()
        .describe('Optional: Filter to get schema for a specific node only'),
});
function formatExecutionSchema(schema, nodeName) {
    const filtered = nodeName ? schema.filter((s) => s.nodeName === nodeName) : schema;
    if (filtered.length === 0) {
        return nodeName
            ? `No execution schema found for node "${nodeName}"`
            : 'No execution schema available';
    }
    const parts = ['<execution_schema>'];
    parts.push((0, truncate_json_1.truncateJson)(filtered));
    parts.push('</execution_schema>');
    return parts.join('\n');
}
exports.GET_EXECUTION_SCHEMA_TOOL = {
    toolName: 'get_execution_schema',
    displayTitle: DISPLAY_TITLE,
};
function createGetExecutionSchemaTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_EXECUTION_SCHEMA_TOOL.toolName, DISPLAY_TITLE);
        try {
            const validatedInput = getExecutionSchemaSchema.parse(input);
            const { nodeName } = validatedInput;
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const executionSchema = state.workflowContext?.executionSchema ?? [];
            logger?.debug(`Getting execution schema${nodeName ? ` for node ${nodeName}` : ''}, found ${executionSchema.length} entries`);
            const formattedSchema = formatExecutionSchema(executionSchema, nodeName);
            const output = {
                found: executionSchema.length > 0,
                count: nodeName
                    ? executionSchema.filter((s) => s.nodeName === nodeName).length
                    : executionSchema.length,
                message: executionSchema.length > 0 ? 'Execution schema retrieved' : 'No schema available',
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, formattedSchema);
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
                toolName: exports.GET_EXECUTION_SCHEMA_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_EXECUTION_SCHEMA_TOOL.toolName,
        description: 'Get the execution schema showing the output data structure from the last workflow execution. Returns the raw n8n schema format with node names and their output schemas. Use this to understand what fields are available from each node.',
        schema: getExecutionSchemaSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_EXECUTION_SCHEMA_TOOL,
    };
}
//# sourceMappingURL=get-execution-schema.tool.js.map