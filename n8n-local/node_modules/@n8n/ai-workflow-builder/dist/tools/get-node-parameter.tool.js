"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_NODE_PARAMETER_TOOL = void 0;
exports.createGetNodeParameterTool = createGetNodeParameterTool;
const tools_1 = require("@langchain/core/tools");
const get_1 = __importDefault(require("lodash/get"));
const zod_1 = require("zod");
const constants_1 = require("../constants");
const helpers_1 = require("../tools/helpers");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const validation_1 = require("./helpers/validation");
const DISPLAY_TITLE = 'Getting node parameter';
const getNodeParameterSchema = zod_1.z.object({
    nodeId: zod_1.z.string().describe('The ID of the node to extract parameter value'),
    path: zod_1.z
        .string()
        .describe('Path to the specific parameter to extract, e.g., "url" or "options.baseUrl"'),
});
function extractParameterValue(node, path) {
    const nodeParameters = node.parameters;
    return (0, get_1.default)(nodeParameters, path);
}
function formatNodeParameter(path, value) {
    const parts = [];
    parts.push('<node_parameter>');
    parts.push('<parameter_path>');
    parts.push(path);
    parts.push('</parameter_path>');
    parts.push('<parameter_value>');
    if (typeof value === 'string') {
        parts.push(value);
    }
    else {
        parts.push(JSON.stringify(value, null, 2));
    }
    parts.push('</parameter_value>');
    parts.push('</node_parameter>');
    return parts.join('\n');
}
exports.GET_NODE_PARAMETER_TOOL = {
    toolName: 'get_node_parameter',
    displayTitle: DISPLAY_TITLE,
};
function createGetNodeParameterTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_NODE_PARAMETER_TOOL.toolName, DISPLAY_TITLE);
        try {
            const validatedInput = getNodeParameterSchema.parse(input);
            const { nodeId, path } = validatedInput;
            reporter.start(validatedInput);
            logger?.debug(`Looking up parameter ${path} for ${nodeId}...`);
            (0, progress_1.reportProgress)(reporter, `Looking up parameter ${path} for ${nodeId}...`);
            const workflow = (0, helpers_1.getEffectiveWorkflow)();
            const node = (0, validation_1.validateNodeExists)(nodeId, workflow.nodes);
            if (!node) {
                logger?.debug(`Node with ID ${nodeId} not found`);
                const error = (0, validation_1.createNodeNotFoundError)(nodeId);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const parameterValue = extractParameterValue(node, path);
            if (parameterValue === undefined) {
                logger?.debug(`Parameter path ${path} not found in node ${node.name}`);
                const error = new errors_1.ValidationError(`Parameter path "${path}" not found in node "${node.name}"`, {
                    extra: { nodeId, path },
                });
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            logger?.debug(`Parameter value for path ${path} in node ${node.name} retrieved`);
            const formattedParameterValue = formatNodeParameter(path, parameterValue);
            if (formattedParameterValue.length > constants_1.MAX_PARAMETER_VALUE_LENGTH) {
                const error = (0, helpers_1.createNodeParameterTooLargeError)(nodeId, path, constants_1.MAX_PARAMETER_VALUE_LENGTH);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const output = {
                message: 'Parameter value retrieved successfully',
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, formattedParameterValue);
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
                toolName: exports.GET_NODE_PARAMETER_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_NODE_PARAMETER_TOOL.toolName,
        description: 'Get the value of a specific parameter of a specific node. Use this ONLY to retrieve parameters omitted in the workflow JSON context because of the size.',
        schema: getNodeParameterSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_NODE_PARAMETER_TOOL,
    };
}
//# sourceMappingURL=get-node-parameter.tool.js.map