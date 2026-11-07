"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const tools_1 = require("@langchain/core/tools");
const agent_execution_1 = require("../../utils/agent-execution");
const createEngineRequests_1 = require("../../utils/agent-execution/createEngineRequests");
const get_1 = __importDefault(require("lodash/get"));
const n8n_workflow_1 = require("n8n-workflow");
const executeTool_1 = require("./utils/executeTool");
const convertToSchema_1 = require("./utils/convertToSchema");
const zod_1 = require("zod");
class ToolExecutor {
    constructor() {
        this.description = {
            displayName: 'Tool Executor',
            name: 'toolExecutor',
            version: 1,
            defaults: {
                name: 'Tool Executor',
            },
            hidden: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main, n8n_workflow_1.NodeConnectionTypes.AiTool],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            builderHint: {
                inputs: {
                    ai_tool: { required: true },
                },
            },
            properties: [
                {
                    displayName: 'Query',
                    name: 'query',
                    type: 'json',
                    default: '{}',
                    description: 'Key-value pairs, where key is the name of the tool name and value is the parameters to pass to the tool',
                },
                {
                    displayName: 'Tool Name',
                    name: 'toolName',
                    type: 'string',
                    default: '',
                    description: 'Name of the tool to execute if the connected tool is a toolkit',
                },
                {
                    displayName: 'Node',
                    name: 'node',
                    type: 'string',
                    default: '',
                    description: 'Name of the node that is being executed',
                },
            ],
            group: ['transform'],
            description: 'Node to execute tools without an AI Agent',
        };
    }
    async execute(response) {
        const hitlResult = (0, agent_execution_1.processHitlResponses)(response, 0);
        if (hitlResult.hasApprovedHitlTools && hitlResult.pendingGatedToolRequest) {
            return hitlResult.pendingGatedToolRequest;
        }
        const query = this.getNodeParameter('query', 0, {});
        const toolName = this.getNodeParameter('toolName', 0, '');
        const node = this.getNodeParameter('node', 0, '');
        let parsedQuery;
        try {
            parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to parse query: ${error.message}`);
        }
        const getQueryData = (name) => {
            return ((0, get_1.default)(parsedQuery, name, null) ?? (0, get_1.default)(parsedQuery, name.replaceAll(' ', '_'), null));
        };
        const resultData = [];
        const toolInputs = await this.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiTool, 0);
        if (!toolInputs || !Array.isArray(toolInputs)) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No tool inputs found');
        }
        try {
            for (const tool of toolInputs) {
                if (tool && typeof tool.getTools === 'function') {
                    const toolsInToolkit = tool.getTools();
                    for (const toolkitTool of toolsInToolkit) {
                        if (!(toolkitTool instanceof tools_1.Tool || toolkitTool instanceof tools_1.StructuredTool)) {
                            continue;
                        }
                        if (toolName === toolkitTool.name) {
                            if ((0, createEngineRequests_1.hasGatedToolNodeName)(toolkitTool.metadata) && node) {
                                const toolInput = {
                                    toolParameters: getQueryData(toolName) ?? {},
                                };
                                const hitlInput = getQueryData(node);
                                if (typeof hitlInput === 'string') {
                                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid hitl input for tool ${toolkitTool.name}`);
                                }
                                const requiresObjectInput = toolkitTool.metadata.originalSchema &&
                                    toolkitTool.metadata.originalSchema instanceof zod_1.ZodObject;
                                if (typeof toolInput.toolParameters === 'string' && requiresObjectInput) {
                                    toolInput.toolParameters = (0, convertToSchema_1.convertValueBySchema)(toolInput.toolParameters, toolkitTool.metadata.originalSchema);
                                }
                                const hitlMetadata = (0, createEngineRequests_1.extractHitlMetadata)(toolkitTool.metadata, toolkitTool.name, toolInput);
                                const engineRequest = [
                                    {
                                        actionType: 'ExecutionNodeAction',
                                        nodeName: node,
                                        input: {
                                            tool: toolName,
                                            toolParameters: toolInput.toolParameters,
                                            ...hitlInput,
                                        },
                                        type: 'ai_tool',
                                        id: crypto.randomUUID(),
                                        metadata: {
                                            itemIndex: 0,
                                            hitl: hitlMetadata,
                                        },
                                    },
                                ];
                                return {
                                    actions: engineRequest,
                                    metadata: (0, agent_execution_1.buildResponseMetadata)(response, 0),
                                };
                            }
                            const result = await (0, executeTool_1.executeTool)(toolkitTool, getQueryData(toolName) ?? {});
                            resultData.push(result);
                        }
                    }
                }
                else {
                    if (!toolName || toolName === tool.name) {
                        const toolInput = getQueryData(toolName || tool.name);
                        const result = await (0, executeTool_1.executeTool)(tool, toolInput ?? {});
                        resultData.push(result);
                    }
                }
            }
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Error executing tool: ${error.message}`);
        }
        return [resultData];
    }
}
exports.ToolExecutor = ToolExecutor;
//# sourceMappingURL=ToolExecutor.node.js.map