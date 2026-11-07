"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTools = validateTools;
const node_type_map_1 = require("../../validation/utils/node-type-map");
const is_tool_1 = require("../utils/is-tool");
const toolsWithoutParameters = [
    '@n8n/n8n-nodes-langchain.toolCalculator',
    '@n8n/n8n-nodes-langchain.toolVectorStore',
    '@n8n/n8n-nodes-langchain.vectorStoreInMemory',
    '@n8n/n8n-nodes-langchain.mcpClientTool',
    '@n8n/n8n-nodes-langchain.toolWikipedia',
    '@n8n/n8n-nodes-langchain.toolSerpApi',
];
function validateTools(workflow, nodeTypes) {
    const violations = [];
    if (!workflow.nodes || workflow.nodes.length === 0) {
        return violations;
    }
    const { nodeTypeMap, nodeTypesByName } = (0, node_type_map_1.createNodeTypeMaps)(nodeTypes);
    for (const node of workflow.nodes) {
        const nodeType = (0, node_type_map_1.getNodeTypeForNode)(node, nodeTypeMap, nodeTypesByName);
        if (!nodeType) {
            continue;
        }
        if ((0, is_tool_1.isTool)(nodeType) && !toolsWithoutParameters.includes(node.type)) {
            if (!node.parameters || Object.keys(node.parameters).length === 0) {
                violations.push({
                    name: 'tool-node-has-no-parameters',
                    type: 'major',
                    description: `Tool node "${node.name}" has no parameters set.`,
                    pointsDeducted: 20,
                });
            }
        }
    }
    return violations;
}
//# sourceMappingURL=tools.js.map