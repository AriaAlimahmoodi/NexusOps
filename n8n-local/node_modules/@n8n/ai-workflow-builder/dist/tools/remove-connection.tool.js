"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMOVE_CONNECTION_TOOL = exports.removeConnectionSchema = void 0;
exports.createRemoveConnectionTool = createRemoveConnectionTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validation_1 = require("./helpers/validation");
exports.removeConnectionSchema = zod_1.z.object({
    sourceNodeId: zod_1.z
        .string()
        .describe('The UUID of the source node where the connection originates from'),
    targetNodeId: zod_1.z.string().describe('The UUID of the target node where the connection goes to'),
    connectionType: zod_1.z
        .string()
        .optional()
        .default('main')
        .describe('The type of connection to remove (default: "main")'),
    sourceOutputIndex: zod_1.z
        .number()
        .optional()
        .default(0)
        .describe('The index of the output to disconnect from (default: 0)'),
    targetInputIndex: zod_1.z
        .number()
        .optional()
        .default(0)
        .describe('The index of the input to disconnect from (default: 0)'),
});
exports.REMOVE_CONNECTION_TOOL = {
    toolName: 'remove_connection',
    displayTitle: 'Removing connection',
};
function buildResponseMessage(sourceNodeName, targetNodeName, connectionType, sourceOutputIndex, targetInputIndex) {
    const parts = [
        `Successfully removed connection: ${sourceNodeName} → ${targetNodeName} (${connectionType})`,
    ];
    if (sourceOutputIndex !== 0 || targetInputIndex !== 0) {
        parts.push(`Output index: ${sourceOutputIndex}, Input index: ${targetInputIndex}`);
    }
    return parts.join('\n');
}
function createRemoveConnectionTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.REMOVE_CONNECTION_TOOL.toolName, exports.REMOVE_CONNECTION_TOOL.displayTitle);
        try {
            const validatedInput = exports.removeConnectionSchema.parse(input);
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const workflow = (0, state_1.getCurrentWorkflow)(state);
            (0, progress_1.reportProgress)(reporter, 'Finding nodes to disconnect...');
            const sourceNode = (0, validation_1.validateNodeExists)(validatedInput.sourceNodeId, workflow.nodes);
            const targetNode = (0, validation_1.validateNodeExists)(validatedInput.targetNodeId, workflow.nodes);
            if (!sourceNode || !targetNode) {
                const missingNodeId = !sourceNode
                    ? validatedInput.sourceNodeId
                    : validatedInput.targetNodeId;
                const nodeError = new errors_1.NodeNotFoundError(missingNodeId);
                const error = {
                    message: nodeError.message,
                    code: 'NODES_NOT_FOUND',
                    details: {
                        sourceNodeId: validatedInput.sourceNodeId,
                        targetNodeId: validatedInput.targetNodeId,
                        foundSource: !!sourceNode,
                        foundTarget: !!targetNode,
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            logger?.debug('\n=== Remove Connection Tool ===');
            logger?.debug(`Attempting to remove connection: ${sourceNode.name} -> ${targetNode.name} (${validatedInput.connectionType})`);
            (0, progress_1.reportProgress)(reporter, `Removing connection from ${sourceNode.name} to ${targetNode.name}...`);
            const sourceConnections = workflow.connections[sourceNode.name];
            if (!sourceConnections) {
                const connectionError = new errors_1.ConnectionError(`Source node "${sourceNode.name}" has no outgoing connections`, {
                    fromNodeId: sourceNode.id,
                    toNodeId: targetNode.id,
                });
                const error = {
                    message: connectionError.message,
                    code: 'CONNECTION_NOT_FOUND',
                    details: {
                        sourceNode: sourceNode.name,
                        targetNode: targetNode.name,
                        connectionType: validatedInput.connectionType,
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const connectionTypeOutputs = sourceConnections[validatedInput.connectionType];
            if (!connectionTypeOutputs || !Array.isArray(connectionTypeOutputs)) {
                const connectionError = new errors_1.ConnectionError(`Source node "${sourceNode.name}" has no connections of type "${validatedInput.connectionType}"`, {
                    fromNodeId: sourceNode.id,
                    toNodeId: targetNode.id,
                });
                const error = {
                    message: connectionError.message,
                    code: 'CONNECTION_TYPE_NOT_FOUND',
                    details: {
                        sourceNode: sourceNode.name,
                        targetNode: targetNode.name,
                        connectionType: validatedInput.connectionType,
                        availableConnectionTypes: Object.keys(sourceConnections),
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const outputConnections = connectionTypeOutputs[validatedInput.sourceOutputIndex];
            if (!outputConnections || !Array.isArray(outputConnections)) {
                const connectionError = new errors_1.ConnectionError(`Source node "${sourceNode.name}" has no connections at output index ${validatedInput.sourceOutputIndex}`, {
                    fromNodeId: sourceNode.id,
                    toNodeId: targetNode.id,
                });
                const error = {
                    message: connectionError.message,
                    code: 'OUTPUT_INDEX_NOT_FOUND',
                    details: {
                        sourceNode: sourceNode.name,
                        targetNode: targetNode.name,
                        connectionType: validatedInput.connectionType,
                        sourceOutputIndex: validatedInput.sourceOutputIndex,
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const connectionExists = outputConnections.some((conn) => conn.node === targetNode.name &&
                conn.type === validatedInput.connectionType &&
                conn.index === validatedInput.targetInputIndex);
            if (!connectionExists) {
                const connectionError = new errors_1.ConnectionError(`Connection not found: ${sourceNode.name} → ${targetNode.name} (${validatedInput.connectionType}) at output ${validatedInput.sourceOutputIndex} to input ${validatedInput.targetInputIndex}`, {
                    fromNodeId: sourceNode.id,
                    toNodeId: targetNode.id,
                });
                const error = {
                    message: connectionError.message,
                    code: 'SPECIFIC_CONNECTION_NOT_FOUND',
                    details: {
                        sourceNode: sourceNode.name,
                        targetNode: targetNode.name,
                        connectionType: validatedInput.connectionType,
                        sourceOutputIndex: validatedInput.sourceOutputIndex,
                        targetInputIndex: validatedInput.targetInputIndex,
                        existingConnections: outputConnections.map((conn) => ({
                            node: conn.node,
                            type: conn.type,
                            index: conn.index,
                        })),
                    },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const message = buildResponseMessage(sourceNode.name, targetNode.name, validatedInput.connectionType, validatedInput.sourceOutputIndex, validatedInput.targetInputIndex);
            logger?.debug('Connection found and will be removed');
            const output = {
                sourceNode: sourceNode.name,
                targetNode: targetNode.name,
                connectionType: validatedInput.connectionType,
                sourceOutputIndex: validatedInput.sourceOutputIndex,
                targetInputIndex: validatedInput.targetInputIndex,
                message,
            };
            reporter.complete(output);
            const stateUpdates = (0, state_1.removeConnectionFromWorkflow)(sourceNode.name, targetNode.name, validatedInput.connectionType, validatedInput.sourceOutputIndex, validatedInput.targetInputIndex);
            return (0, response_1.createSuccessResponse)(config, message, stateUpdates);
        }
        catch (error) {
            let toolError;
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid connection removal parameters', {
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
        name: exports.REMOVE_CONNECTION_TOOL.toolName,
        description: `Remove a specific connection between two nodes in the workflow. This allows you to disconnect nodes without deleting them.

USAGE:
Use this tool when you need to break an existing connection while keeping both nodes in the workflow.

PARAMETERS:
- sourceNodeId: The UUID of the node that is the source of the connection (where the data comes from)
- targetNodeId: The UUID of the node that receives the connection (where the data goes to)
- connectionType: The type of connection to remove (default: "main")
  * For regular data flow: "main"
  * For AI connections: "ai_languageModel", "ai_tool", "ai_memory", "ai_embedding", "ai_document", etc.
- sourceOutputIndex: Which output of the source node to disconnect from (default: 0)
- targetInputIndex: Which input of the target node to disconnect from (default: 0)

EXAMPLES:
1. Remove main data connection:
   sourceNodeId: "abc-123", targetNodeId: "def-456", connectionType: "main"

2. Remove AI model from AI Agent:
   sourceNodeId: "model-id", targetNodeId: "agent-id", connectionType: "ai_languageModel"

3. Remove specific connection when multiple exist:
   sourceNodeId: "node-1", targetNodeId: "node-2", connectionType: "main", sourceOutputIndex: 1, targetInputIndex: 0

NOTES:
- Both nodes must exist in the workflow
- The specific connection must exist or an error will be returned
- Use this when restructuring workflows or replacing connections`,
        schema: exports.removeConnectionSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.REMOVE_CONNECTION_TOOL,
    };
}
//# sourceMappingURL=remove-connection.tool.js.map