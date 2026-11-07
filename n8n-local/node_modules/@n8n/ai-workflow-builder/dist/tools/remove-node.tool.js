"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMOVE_NODE_TOOL = void 0;
exports.createRemoveNodeTool = createRemoveNodeTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validation_1 = require("./helpers/validation");
const removeNodeSchema = zod_1.z.object({
    nodeId: zod_1.z.string().describe('The ID of the node to remove from the workflow'),
});
function countNodeConnections(nodeId, connections) {
    let count = 0;
    if (connections[nodeId]) {
        for (const connectionType of Object.values(connections[nodeId])) {
            if (Array.isArray(connectionType)) {
                for (const outputs of connectionType) {
                    if (Array.isArray(outputs)) {
                        count += outputs.length;
                    }
                }
            }
        }
    }
    for (const [_sourceNodeId, nodeConnections] of Object.entries(connections)) {
        for (const outputs of Object.values(nodeConnections)) {
            if (Array.isArray(outputs)) {
                for (const outputConnections of outputs) {
                    if (Array.isArray(outputConnections)) {
                        count += outputConnections.filter((conn) => conn.node === nodeId).length;
                    }
                }
            }
        }
    }
    return count;
}
function buildResponseMessage(nodeName, nodeType, connectionsRemoved) {
    const parts = [`Successfully removed node "${nodeName}" (${nodeType})`];
    if (connectionsRemoved > 0) {
        parts.push(`Removed ${connectionsRemoved} connection${connectionsRemoved > 1 ? 's' : ''}`);
    }
    return parts.join('\n');
}
exports.REMOVE_NODE_TOOL = {
    toolName: 'remove_node',
    displayTitle: 'Removing node',
};
function createRemoveNodeTool(_logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.REMOVE_NODE_TOOL.toolName, exports.REMOVE_NODE_TOOL.displayTitle);
        try {
            const validatedInput = removeNodeSchema.parse(input);
            const { nodeId } = validatedInput;
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const workflow = (0, state_1.getCurrentWorkflow)(state);
            (0, progress_1.reportProgress)(reporter, `Removing node ${nodeId}`);
            const nodeToRemove = (0, validation_1.validateNodeExists)(nodeId, workflow.nodes);
            if (!nodeToRemove) {
                const error = (0, validation_1.createNodeNotFoundError)(nodeId);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const connectionsRemoved = countNodeConnections(nodeId, workflow.connections);
            const message = buildResponseMessage(nodeToRemove.name, nodeToRemove.type, connectionsRemoved);
            const output = {
                removedNodeId: nodeId,
                removedNodeName: nodeToRemove.name,
                removedNodeType: nodeToRemove.type,
                connectionsRemoved,
                message,
            };
            reporter.complete(output);
            const stateUpdates = (0, state_1.removeNodeFromWorkflow)(nodeId);
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
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Unknown error occurred', {
                toolName: exports.REMOVE_NODE_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.REMOVE_NODE_TOOL.toolName,
        description: 'Remove a node from the workflow by its ID. This will also remove all connections to and from the node. Use this tool when you need to delete a node that is no longer needed in the workflow.',
        schema: removeNodeSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.REMOVE_NODE_TOOL,
    };
}
//# sourceMappingURL=remove-node.tool.js.map