"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATE_STRUCTURE_TOOL = void 0;
exports.createValidateStructureTool = createValidateStructureTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const checks_1 = require("../validation/checks");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validateStructureSchema = zod_1.z.object({}).strict().default({});
exports.VALIDATE_STRUCTURE_TOOL = {
    toolName: 'validate_structure',
    displayTitle: 'Validating structure',
};
function createValidateStructureTool(parsedNodeTypes) {
    const dynamicTool = (0, tools_1.tool)(async (input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.VALIDATE_STRUCTURE_TOOL.toolName, exports.VALIDATE_STRUCTURE_TOOL.displayTitle);
        try {
            const validatedInput = validateStructureSchema.parse(input ?? {});
            reporter.start(validatedInput);
            const workflow = (0, state_1.getEffectiveWorkflow)();
            (0, progress_1.reportProgress)(reporter, 'Validating structure');
            const connectionViolations = (0, checks_1.validateConnections)(workflow, parsedNodeTypes);
            const triggerViolations = (0, checks_1.validateTrigger)(workflow, parsedNodeTypes);
            const allViolations = [...connectionViolations, ...triggerViolations];
            let message;
            if (allViolations.length === 0) {
                message =
                    'Workflow structure is valid. All connections are correct and trigger node is present.';
            }
            else {
                message = `Found ${allViolations.length} structure issues:\n${allViolations.map((v) => `- ${v.description}`).join('\n')}`;
            }
            reporter.complete({ message });
            const stateUpdates = {
                structureValidation: { connections: connectionViolations, trigger: triggerViolations },
            };
            return (0, response_1.createSuccessResponse)(config, message, stateUpdates);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid input parameters', {
                    extra: { errors: error.errors },
                });
                reporter.error(validationError);
                return (0, response_1.createErrorResponse)(config, validationError);
            }
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Failed to validate structure', {
                toolName: exports.VALIDATE_STRUCTURE_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.VALIDATE_STRUCTURE_TOOL.toolName,
        description: 'Validate workflow structure (connections, trigger). Call after creating nodes/connections to check for issues.',
        schema: validateStructureSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.VALIDATE_STRUCTURE_TOOL,
    };
}
//# sourceMappingURL=validate-structure.tool.js.map