"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPolicedNodes = toPolicedNodes;
exports.withInlineAgentToolNodes = withInlineAgentToolNodes;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const resolve_tool_node_type_1 = require("../node-execution/resolve-tool-node-type");
const MESSAGE_AN_AGENT_NODE_TYPES = new Set([
    'n8n-nodes-base.messageAnAgent',
    'n8n-nodes-base.messageAnAgentTool',
]);
const PolicedNodeToolSchema = api_types_1.NodeToolJsonConfigSchema.strip();
function toPolicedCredentials(credentials) {
    if (!(0, is_record_1.isRecord)(credentials))
        return undefined;
    const policed = {};
    for (const [slot, ref] of Object.entries(credentials)) {
        const id = (0, is_record_1.isRecord)(ref) && typeof ref.id === 'string' ? ref.id : null;
        const name = (0, is_record_1.isRecord)(ref) && typeof ref.name === 'string' ? ref.name : '';
        policed[slot] = { id, name };
    }
    return policed;
}
function readNodeTool(tool, index) {
    if (!(0, is_record_1.isRecord)(tool) || tool.type !== 'node')
        return null;
    const parsed = PolicedNodeToolSchema.safeParse(tool);
    if (parsed.success) {
        const { name, node } = parsed.data;
        return {
            name,
            nodeType: node.nodeType,
            nodeTypeVersion: node.nodeTypeVersion,
            nodeParameters: node.nodeParameters,
            credentials: toPolicedCredentials(node.credentials),
        };
    }
    const { node } = tool;
    if (!(0, is_record_1.isRecord)(node) || typeof node.nodeType !== 'string')
        return null;
    return {
        name: `Tool ${index + 1}`,
        nodeType: node.nodeType,
        nodeTypeVersion: typeof node.nodeTypeVersion === 'number' ? node.nodeTypeVersion : 1,
        nodeParameters: node.nodeParameters,
        credentials: toPolicedCredentials(node.credentials),
    };
}
function inlineAgentTools(nodeType, parameters) {
    if (!MESSAGE_AN_AGENT_NODE_TYPES.has(nodeType) || !(0, is_record_1.isRecord)(parameters))
        return undefined;
    if (parameters.agentSource !== 'inline')
        return undefined;
    const raw = parameters.inlineAgent;
    const payload = typeof raw === 'string' && !raw.startsWith('=')
        ? (0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: null })
        : raw;
    return (0, is_record_1.isRecord)(payload) && (0, is_record_1.isRecord)(payload.config) ? payload.config.tools : undefined;
}
function toPolicedNodesWithPrefix(tools, idPrefix) {
    if (!Array.isArray(tools))
        return [];
    return tools.flatMap((raw, index) => {
        const tool = readNodeTool(raw, index);
        if (!tool)
            return [];
        return [
            {
                id: `${idPrefix}${index}`,
                name: tool.name,
                type: (0, resolve_tool_node_type_1.resolveToolNodeType)(tool.nodeType, tool.nodeTypeVersion),
                typeVersion: tool.nodeTypeVersion,
                position: [0, 0],
                parameters: (0, n8n_workflow_1.isNodeParameters)(tool.nodeParameters) ? tool.nodeParameters : {},
                credentials: tool.credentials,
            },
        ];
    });
}
function toPolicedNodes(tools) {
    return toPolicedNodesWithPrefix(tools, 'agent-tool-');
}
function withInlineAgentToolNodes(nodes) {
    const embedded = nodes.flatMap((node) => {
        const tools = toPolicedNodesWithPrefix(inlineAgentTools(node.type, node.parameters), `${node.id}-tool-`);
        return tools.length === 0 ? [] : withInlineAgentToolNodes(tools);
    });
    return embedded.length === 0 ? nodes : [...nodes, ...embedded];
}
//# sourceMappingURL=policed-agent-nodes.js.map