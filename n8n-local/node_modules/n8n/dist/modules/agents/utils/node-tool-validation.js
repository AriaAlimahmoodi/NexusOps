"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHttpRequestToolUrlFromAiViolations = findHttpRequestToolUrlFromAiViolations;
exports.validateNodeToolExpressions = validateNodeToolExpressions;
exports.validateNodeToolConfigs = validateNodeToolConfigs;
const fromai_helpers_1 = require("@n8n/ai-utilities/fromai-helpers");
const n8n_workflow_1 = require("n8n-workflow");
const node_tool_operation_support_1 = require("../../../node-execution/node-tool-operation-support");
const node_definition_dirs_1 = require("../../../utils/node-definition-dirs");
const HTTP_REQUEST_TOOL_NODE_TYPE = `${n8n_workflow_1.HTTP_REQUEST_NODE_TYPE}Tool`;
function findHttpRequestToolUrlFromAiViolations(tools) {
    return (tools ?? []).flatMap((tool, toolIndex) => {
        if (tool.type !== 'node' ||
            (tool.node.nodeType !== n8n_workflow_1.HTTP_REQUEST_NODE_TYPE &&
                tool.node.nodeType !== HTTP_REQUEST_TOOL_NODE_TYPE)) {
            return [];
        }
        const url = tool.node.nodeParameters?.url;
        if (typeof url !== 'string')
            return [];
        try {
            if ((0, n8n_workflow_1.extractFromAICalls)(url).length === 0)
                return [];
        }
        catch {
        }
        return [
            {
                toolIndex,
                toolName: tool.name,
                path: `tools.${toolIndex}.node.nodeParameters.url`,
            },
        ];
    });
}
function validateNodeToolExpressions(tools) {
    for (const tool of tools ?? []) {
        if (tool.enabled === false || tool.type !== 'node')
            continue;
        (0, fromai_helpers_1.extractFromAIParameters)((tool.node.nodeParameters ?? {}));
    }
}
async function validateNodeToolConfigs(tools) {
    const nodeTools = (tools ?? []).filter((t) => t.enabled !== false && t.type === 'node');
    if (nodeTools.length === 0)
        return null;
    const { getSchemaBaseDirs, setSchemaBaseDirs, validateNodeConfig } = await import('@n8n/workflow-sdk');
    const dirs = (0, node_definition_dirs_1.resolveBuiltinNodeDefinitionDirs)();
    if (dirs.length > 0 && dirs.join('\n') !== getSchemaBaseDirs().join('\n')) {
        setSchemaBaseDirs(dirs);
    }
    const errors = [];
    for (const tool of nodeTools) {
        const nodeType = tool.node.nodeType;
        const nodeTypeVersion = tool.node.nodeTypeVersion;
        const nodeParameters = tool.node.nodeParameters ?? {};
        const operation = nodeParameters.operation;
        if ((0, node_tool_operation_support_1.isUnsupportedEphemeralNodeOperation)(operation)) {
            errors.push(`Node tool "${tool.name}" (${nodeType}@${nodeTypeVersion}): ${(0, node_tool_operation_support_1.unsupportedEphemeralNodeOperationMessage)(operation)}`);
            continue;
        }
        const result = validateNodeConfig(nodeType, nodeTypeVersion, { parameters: nodeParameters }, { isToolNode: true });
        if (!result.valid) {
            const messages = result.errors
                .map((e) => e.message)
                .join('; ');
            errors.push(`Node tool "${tool.name}" (${nodeType}@${nodeTypeVersion}): ${messages}`);
        }
    }
    return errors.length > 0 ? errors.join('\n') : null;
}
//# sourceMappingURL=node-tool-validation.js.map