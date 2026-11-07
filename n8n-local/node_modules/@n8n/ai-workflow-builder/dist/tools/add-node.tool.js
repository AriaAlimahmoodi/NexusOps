"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeCreationE2ESchema = exports.nodeCreationSchema = void 0;
exports.getAddNodeToolBase = getAddNodeToolBase;
exports.createAddNodeTool = createAddNodeTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const node_creation_utils_1 = require("./utils/node-creation.utils");
const node_positioning_utils_1 = require("./utils/node-positioning.utils");
const node_helpers_1 = require("../utils/node-helpers");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validation_1 = require("./helpers/validation");
const nodeSettingsSchema = zod_1.z
    .object({
    executeOnce: zod_1.z
        .boolean()
        .optional()
        .describe('When true, node executes only once using data from the first item, ignoring all additional items'),
    onError: zod_1.z
        .enum(['stopWorkflow', 'continueRegularOutput', 'continueErrorOutput'])
        .optional()
        .describe('Error handling: stopWorkflow (halt), continueRegularOutput (continue with input data), continueErrorOutput (separate errors to error output branch)'),
})
    .optional();
const baseSchema = {
    nodeType: zod_1.z.string().describe('The type of node to add (e.g., n8n-nodes-base.httpRequest)'),
    nodeVersion: zod_1.z.number().describe('The exact node version'),
    name: zod_1.z
        .string()
        .describe('A descriptive name for the node that clearly indicates its purpose in the workflow'),
    initialParametersReasoning: zod_1.z
        .string()
        .describe('REQUIRED: Explain your reasoning about initial parameters. Consider: Does this node have dynamic inputs/outputs? Does it need mode/operation/resource parameters? For example: "Vector Store has dynamic inputs based on mode, so I need to set mode:insert for document input" or "Gmail needs resource:message and operation:send to send emails"'),
    initialParameters: zod_1.z
        .object({})
        .passthrough()
        .describe('Initial parameters to set on the node. This includes: (1) connection-affecting parameters like mode, hasOutputParser, textSplittingMode; (2) resource/operation for nodes with multiple resources (Gmail, Notion, Google Sheets, etc.). Pass an empty object {} if no initial parameters are needed.'),
    nodeSettings: nodeSettingsSchema.describe('Optional node execution settings. Only set when specific behavior is needed.'),
};
exports.nodeCreationSchema = zod_1.z.object(baseSchema);
exports.nodeCreationE2ESchema = zod_1.z.object({
    ...baseSchema,
    id: zod_1.z
        .string()
        .optional()
        .describe('Optional: A specific ID to use for this node. If not provided, a unique ID will be generated automatically. This is primarily used for testing purposes to ensure deterministic node IDs.'),
});
function createNode(nodeType, typeVersion, customName, existingNodes, nodeTypes, initialParameters, id, nodeSettings) {
    const baseName = customName ?? nodeType.defaults?.name ?? nodeType.displayName;
    const uniqueName = (0, node_creation_utils_1.generateUniqueName)(baseName, existingNodes);
    const position = (0, node_positioning_utils_1.calculateNodePosition)(existingNodes, (0, node_helpers_1.isSubNode)(nodeType), nodeTypes);
    return (0, node_creation_utils_1.createNodeInstance)(nodeType, typeVersion, uniqueName, position, initialParameters, id, nodeSettings);
}
function buildResponseMessage(addedNode, nodeTypes) {
    const nodeType = nodeTypes.find((nt) => nt.name === addedNode.type);
    const nodeTypeInfo = nodeType && (0, node_helpers_1.isSubNode)(nodeType) ? ' (sub-node)' : '';
    return `Successfully added "${addedNode.name}" (${addedNode.displayName ?? addedNode.type})${nodeTypeInfo} with ID ${addedNode.id}`;
}
function getCustomNodeTitle(input, nodeTypes) {
    if ('nodeType' in input && typeof input['nodeType'] === 'string') {
        const nodeType = nodeTypes.find((type) => type.name === input.nodeType);
        if (nodeType) {
            return `Adding ${nodeType.displayName} node`;
        }
    }
    return 'Adding node';
}
function getAddNodeToolBase(nodeTypes) {
    return {
        toolName: 'add_nodes',
        displayTitle: 'Adding nodes',
        getCustomDisplayTitle: (input) => getCustomNodeTitle(input, nodeTypes),
    };
}
function createAddNodeTool(nodeTypes) {
    const builderToolBase = getAddNodeToolBase(nodeTypes);
    const dynamicTool = (0, tools_1.tool)(async (input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, builderToolBase.toolName, builderToolBase.displayTitle, getCustomNodeTitle(input, nodeTypes));
        try {
            let id;
            let validatedInput;
            if (process.env.E2E_TESTS) {
                const e2eInput = exports.nodeCreationE2ESchema.parse(input);
                id = e2eInput.id;
                validatedInput = e2eInput;
            }
            else {
                validatedInput = exports.nodeCreationSchema.parse(input);
            }
            const { nodeType, nodeVersion, name, initialParametersReasoning, initialParameters, nodeSettings, } = validatedInput;
            reporter.start(validatedInput);
            const state = (0, state_1.getWorkflowState)();
            const workflow = (0, state_1.getCurrentWorkflow)(state);
            reporter.progress(`Adding ${name} (${initialParametersReasoning})`);
            const nodeTypeDesc = (0, validation_1.findNodeType)(nodeType, nodeVersion, nodeTypes);
            if (!nodeTypeDesc) {
                const nodeError = new errors_1.NodeTypeNotFoundError(nodeType);
                const error = {
                    message: nodeError.message,
                    code: 'NODE_TYPE_NOT_FOUND',
                    details: { nodeType },
                };
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const newNode = createNode(nodeTypeDesc, nodeVersion, name, workflow.nodes, nodeTypes, initialParameters, id, nodeSettings);
            const addedNodeInfo = {
                id: newNode.id,
                name: newNode.name,
                type: newNode.type,
                displayName: nodeTypeDesc.displayName,
                position: newNode.position,
                parameters: newNode.parameters,
            };
            const message = buildResponseMessage(addedNodeInfo, nodeTypes);
            const output = {
                addedNode: addedNodeInfo,
                message,
            };
            reporter.complete(output);
            const stateUpdates = (0, state_1.addNodeToWorkflow)(newNode);
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
                toolName: builderToolBase.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: builderToolBase.toolName,
        description: `Add a node to the workflow canvas. Each node represents a specific action or operation (e.g., HTTP request, data transformation, database query). Always provide descriptive names that explain what the node does (e.g., "Get Customer Data", "Filter Active Users", "Send Email Notification"). The tool handles automatic positioning. Use this tool after searching for available node types to ensure they exist.

To add multiple nodes, call this tool multiple times in parallel.

Provide both:
1. initialParametersReasoning - Explain why you're choosing specific initial parameters or using {}
2. initialParameters - The actual parameters (use {} for nodes without special needs)

Explicitly set parameters that affect connections or define the node's behavior rather than relying on defaults.

Reasoning examples:
- "Vector Store has dynamic inputs that change based on mode parameter, setting mode:insert to accept document inputs"
- "HTTP Request has static inputs/outputs, no initial parameters needed"
- "Gmail needs resource:message and operation:send to send emails"
- "AI Agent has dynamic inputs, setting hasOutputParser:true to enable output parser connections"
- "Set node has standard main connections only, using empty parameters"

INITIAL PARAMETERS (set explicitly when needed):
- AI Agent (@n8n/n8n-nodes-langchain.agent):
  - For output parser support: { hasOutputParser: true }
  - Without output parser: { hasOutputParser: false }
- Vector Store (@n8n/n8n-nodes-langchain.vectorStoreInMemory):
  - For document input: { mode: "insert" }
  - For querying: { mode: "retrieve" }
  - For AI Agent and tool use: { mode: "retrieve-as-tool" }
- Document Loader (@n8n/n8n-nodes-langchain.documentDefaultDataLoader):
  - For text splitter input: { textSplittingMode: "custom" }
  - For built-in splitting: { textSplittingMode: "simple" }
- Nodes with resource/operation (Gmail, Notion, Google Sheets, etc.):
  - Set resource AND operation based on user intent (e.g., { resource: "message", operation: "send" })
- Regular nodes (HTTP Request, Set, Code, etc.): {}

Consider the initialParametersReasoning first, then set initialParameters accordingly.

NODE SETTINGS (optional - only set when specific behavior is needed):
- executeOnce: true - Node executes only once using the first item, ignoring additional items (e.g., send one notification even if 10 items arrive)
- onError: Controls what happens when the node errors
  - 'stopWorkflow' (default) - Halts entire workflow immediately
  - 'continueRegularOutput' - Continues with input data passed through (error info in json), failed items not separated
  - 'continueErrorOutput' - Separates errors to dedicated error output branch (last output index), successful items continue normally`,
        schema: exports.nodeCreationSchema,
    });
    return {
        tool: dynamicTool,
        ...builderToolBase,
    };
}
//# sourceMappingURL=add-node.tool.js.map