"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInvalidAiToolSources = findInvalidAiToolSources;
exports.formatInvalidAiToolSourceMessage = formatInvalidAiToolSourceMessage;
exports.createNodeOutputsResolver = createNodeOutputsResolver;
exports.buildInvalidAiToolSourceErrorResponse = buildInvalidAiToolSourceErrorResponse;
const n8n_workflow_1 = require("n8n-workflow");
const mcp_constants_1 = require("../../mcp.constants");
function isValidAiToolSourceType(type, version, resolveOutputs) {
    if (type.endsWith('Tool'))
        return true;
    const outputs = resolveOutputs(type, version);
    if (!outputs)
        return true;
    return (0, n8n_workflow_1.getConnectionTypes)(outputs).includes(n8n_workflow_1.NodeConnectionTypes.AiTool);
}
function findInvalidAiToolSources(workflow, resolveOutputs) {
    const nodesByName = new Map();
    for (const node of workflow.nodes) {
        if (node.name) {
            nodesByName.set(node.name, { type: node.type, typeVersion: node.typeVersion ?? 1 });
        }
    }
    const violations = [];
    for (const [sourceNode, byType] of Object.entries(workflow.connections ?? {})) {
        const toolOutputs = byType?.[n8n_workflow_1.NodeConnectionTypes.AiTool];
        if (!Array.isArray(toolOutputs))
            continue;
        const sourceMeta = nodesByName.get(sourceNode);
        if (!sourceMeta)
            continue;
        if (isValidAiToolSourceType(sourceMeta.type, sourceMeta.typeVersion, resolveOutputs))
            continue;
        const targets = [];
        for (const outputs of toolOutputs) {
            if (!outputs)
                continue;
            for (const conn of outputs) {
                if (conn?.node)
                    targets.push(conn.node);
            }
        }
        if (targets.length > 0) {
            violations.push({ sourceNode, sourceType: sourceMeta.type, targets });
        }
    }
    return violations;
}
function formatInvalidAiToolSourceMessage(violations) {
    const lines = violations.map(({ sourceNode, sourceType, targets }) => {
        const targetList = targets.map((t) => `'${t}'`).join(', ');
        return `'${sourceNode}' (${sourceType}) cannot be used as a tool for ${targetList} — its node type does not produce an 'ai_tool' output.`;
    });
    return [
        'Invalid connection: a node was wired as a tool to an agent, but its type does not produce an ai_tool output.',
        ...lines,
        "Use a node whose type produces an 'ai_tool' output — typically any node with a 'Tool' suffix (e.g. '@n8n/n8n-nodes-langchain.toolCalculator', '@n8n/n8n-nodes-langchain.toolHttpRequest', or '@n8n/n8n-nodes-langchain.agentTool' for sub-agent calls).",
    ].join(' ');
}
function createNodeOutputsResolver(nodeTypes) {
    return (type, version) => {
        try {
            const nodeType = nodeTypes.getByNameAndVersion(type, version);
            const outputs = nodeType?.description?.outputs;
            if (!Array.isArray(outputs))
                return undefined;
            return outputs;
        }
        catch {
            return undefined;
        }
    };
}
function buildInvalidAiToolSourceErrorResponse(workflow, nodeTypes, buildOutput, telemetryPayload, telemetry) {
    const violations = findInvalidAiToolSources(workflow, createNodeOutputsResolver(nodeTypes));
    if (violations.length === 0)
        return null;
    const errorMessage = formatInvalidAiToolSourceMessage(violations);
    telemetryPayload.results = { success: false, error: errorMessage };
    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
    const output = buildOutput(errorMessage);
    return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
        isError: true,
    };
}
//# sourceMappingURL=connection-structure-check.js.map