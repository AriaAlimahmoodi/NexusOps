"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RENAME_NODE_TOOL = exports.renameNodeSchema = void 0;
exports.createRenameNodeTool = createRenameNodeTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validation_1 = require("./helpers/validation");
exports.renameNodeSchema = zod_1.z.object({
    nodeId: zod_1.z.string().describe('The UUID of the node to rename'),
    newName: zod_1.z.string().min(1).describe('The new name for the node'),
});
exports.RENAME_NODE_TOOL = {
    toolName: 'rename_node',
    displayTitle: 'Renaming node',
};
function buildResponseMessage(oldName, newName) {
    return `Successfully renamed node from "${oldName}" to "${newName}"`;
}
function createRenameNodeTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.RENAME_NODE_TOOL.toolName, exports.RENAME_NODE_TOOL.displayTitle);
        try {
            const validatedInput = exports.renameNodeSchema.parse(input);
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const workflow = (0, state_1.getCurrentWorkflow)(state);
            (0, progress_1.reportProgress)(reporter, 'Finding node to rename...');
            const node = (0, validation_1.validateNodeExists)(validatedInput.nodeId, workflow.nodes);
            if (!node) {
                const error = (0, validation_1.createNodeNotFoundError)(validatedInput.nodeId);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const oldName = node.name;
            const newName = validatedInput.newName;
            if (oldName === newName) {
                const validationError = new errors_1.ValidationError(`Node "${oldName}" already has this name`, {
                    field: 'newName',
                    value: newName,
                });
                const error = {
                    message: validationError.message,
                    code: 'SAME_NAME',
                    details: {
                        nodeId: validatedInput.nodeId,
                        currentName: oldName,
                        newName,
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const existingNode = workflow.nodes.find((n) => n.name === newName && n.id !== validatedInput.nodeId);
            if (existingNode) {
                const validationError = new errors_1.ValidationError(`A node with the name "${newName}" already exists`, {
                    field: 'newName',
                    value: newName,
                });
                const error = {
                    message: validationError.message,
                    code: 'NAME_CONFLICT',
                    details: {
                        nodeId: validatedInput.nodeId,
                        newName,
                        conflictingNodeId: existingNode.id,
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            logger?.debug('\n=== Rename Node Tool ===');
            logger?.debug(`Renaming node: "${oldName}" -> "${newName}"`);
            (0, progress_1.reportProgress)(reporter, `Renaming "${oldName}" to "${newName}"...`);
            const message = buildResponseMessage(oldName, newName);
            logger?.debug('Node will be renamed');
            const output = {
                nodeId: validatedInput.nodeId,
                oldName,
                newName,
                message,
            };
            const stateUpdates = (0, state_1.renameNodeInWorkflow)(validatedInput.nodeId, oldName, newName);
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, message, stateUpdates);
        }
        catch (error) {
            let toolError;
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid rename node parameters', {
                    field: error.errors[0]?.path.join('.'),
                    value: error.errors[0]?.message,
                });
                toolError = {
                    message: validationError.message,
                    code: 'VALIDATION_ERROR',
                    details: error.errors,
                };
            }
            else {
                toolError = {
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    code: 'EXECUTION_ERROR',
                };
            }
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.RENAME_NODE_TOOL.toolName,
        description: `Rename a node in the workflow. This updates the node's display name and automatically updates all connection references.

USAGE:
Use this tool when you need to give a node a more descriptive or meaningful name.

PARAMETERS:
- nodeId: The UUID of the node to rename
- newName: The new name for the node (must be unique in the workflow)

EXAMPLES:
1. Rename a generic node:
   nodeId: "abc-123", newName: "Process Customer Data"

2. Rename after duplicating:
   nodeId: "def-456", newName: "Send Welcome Email"

NOTES:
- The node must exist in the workflow
- The new name must not conflict with any other node name in the workflow
- All connections to/from this node will be automatically updated`,
        schema: exports.renameNodeSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.RENAME_NODE_TOOL,
    };
}
//# sourceMappingURL=rename-node.tool.js.map