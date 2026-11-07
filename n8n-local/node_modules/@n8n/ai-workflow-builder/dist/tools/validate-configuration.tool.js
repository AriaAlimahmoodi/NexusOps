"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATE_CONFIGURATION_TOOL = void 0;
exports.createValidateConfigurationTool = createValidateConfigurationTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const checks_1 = require("../validation/checks");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validateConfigurationSchema = zod_1.z.object({}).strict().default({});
exports.VALIDATE_CONFIGURATION_TOOL = {
    toolName: 'validate_configuration',
    displayTitle: 'Validating configuration',
};
function createValidateConfigurationTool(parsedNodeTypes) {
    const dynamicTool = (0, tools_1.tool)(async (input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.VALIDATE_CONFIGURATION_TOOL.toolName, exports.VALIDATE_CONFIGURATION_TOOL.displayTitle);
        try {
            const validatedInput = validateConfigurationSchema.parse(input ?? {});
            reporter.start(validatedInput);
            const workflow = (0, state_1.getEffectiveWorkflow)();
            (0, progress_1.reportProgress)(reporter, 'Validating configuration');
            const agentViolations = (0, checks_1.validateAgentPrompt)(workflow);
            const toolViolations = (0, checks_1.validateTools)(workflow, parsedNodeTypes);
            const fromAiViolations = (0, checks_1.validateFromAi)(workflow, parsedNodeTypes);
            const parameterViolations = (0, checks_1.validateParameters)(workflow, parsedNodeTypes);
            const allViolations = [
                ...agentViolations,
                ...toolViolations,
                ...fromAiViolations,
                ...parameterViolations,
            ];
            let message;
            if (allViolations.length === 0) {
                message =
                    'Configuration is valid. Agent prompts, tools, $fromAI usage, and required parameters are correct.';
            }
            else {
                message = `Found ${allViolations.length} configuration issues:\n${allViolations.map((v) => `- ${v.description}`).join('\n')}`;
            }
            reporter.complete({ message });
            return (0, response_1.createSuccessResponse)(config, message, {
                configurationValidation: {
                    agentPrompt: agentViolations,
                    tools: toolViolations,
                    fromAi: fromAiViolations,
                    parameters: parameterViolations,
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid input parameters', {
                    extra: { errors: error.errors },
                });
                reporter.error(validationError);
                return (0, response_1.createErrorResponse)(config, validationError);
            }
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Failed to validate configuration', {
                toolName: exports.VALIDATE_CONFIGURATION_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.VALIDATE_CONFIGURATION_TOOL.toolName,
        description: 'Validate node configuration (agent prompts, tool parameters, $fromAI usage, required parameters, option values). Call after configuring nodes to check for issues.',
        schema: validateConfigurationSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.VALIDATE_CONFIGURATION_TOOL,
    };
}
//# sourceMappingURL=validate-configuration.tool.js.map