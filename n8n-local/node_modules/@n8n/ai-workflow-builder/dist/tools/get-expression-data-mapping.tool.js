"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_EXPRESSION_DATA_MAPPING_TOOL = void 0;
exports.createGetExpressionDataMappingTool = createGetExpressionDataMappingTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const truncate_json_1 = require("../utils/truncate-json");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const DISPLAY_TITLE = 'Getting expression data mapping';
const getExpressionDataMappingSchema = zod_1.z.object({
    nodeName: zod_1.z
        .string()
        .optional()
        .describe('Optional: Filter to get expression values for a specific node only'),
});
function formatExpressionValues(expressionValues, nodeName) {
    if (!expressionValues || Object.keys(expressionValues).length === 0) {
        return nodeName
            ? `No expression data mapping found for node "${nodeName}"`
            : 'No expression data mapping available. The workflow may not have expressions or has not been executed.';
    }
    const filtered = nodeName
        ? Object.fromEntries(Object.entries(expressionValues).filter(([key]) => key === nodeName))
        : expressionValues;
    if (Object.keys(filtered).length === 0) {
        return `No expression data mapping found for node "${nodeName}"`;
    }
    const parts = ['<expression_data_mapping>'];
    parts.push((0, truncate_json_1.truncateJson)(filtered));
    parts.push('</expression_data_mapping>');
    return parts.join('\n');
}
exports.GET_EXPRESSION_DATA_MAPPING_TOOL = {
    toolName: 'get_expression_data_mapping',
    displayTitle: DISPLAY_TITLE,
};
function createGetExpressionDataMappingTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_EXPRESSION_DATA_MAPPING_TOOL.toolName, DISPLAY_TITLE);
        try {
            const validatedInput = getExpressionDataMappingSchema.parse(input);
            const { nodeName } = validatedInput;
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const expressionValues = state.workflowContext?.expressionValues;
            const nodeCount = expressionValues ? Object.keys(expressionValues).length : 0;
            logger?.debug(`Getting expression data mapping${nodeName ? ` for node ${nodeName}` : ''}, found ${nodeCount} nodes with expressions`);
            const formattedMapping = formatExpressionValues(expressionValues, nodeName);
            const output = {
                found: nodeCount > 0,
                nodesWithExpressions: nodeCount,
                message: nodeCount > 0 ? 'Expression data mapping retrieved' : 'No expressions found',
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, formattedMapping);
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
                toolName: exports.GET_EXPRESSION_DATA_MAPPING_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_EXPRESSION_DATA_MAPPING_TOOL.toolName,
        description: 'Get the resolved expression values from the last workflow execution. Shows what data was used in expressions like {{ $json.fieldName }} and their resolved values.',
        schema: getExpressionDataMappingSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_EXPRESSION_DATA_MAPPING_TOOL,
    };
}
//# sourceMappingURL=get-expression-data-mapping.tool.js.map