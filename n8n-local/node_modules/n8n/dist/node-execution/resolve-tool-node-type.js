"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolNodeType = resolveToolNodeType;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../node-types");
function resolveToolNodeType(nodeType, nodeTypeVersion) {
    if ((0, n8n_workflow_1.isToolType)(nodeType))
        return nodeType;
    const toolNodeType = `${nodeType}Tool`;
    try {
        di_1.Container.get(node_types_1.NodeTypes).getByNameAndVersion(toolNodeType, nodeTypeVersion);
        return toolNodeType;
    }
    catch {
        return nodeType;
    }
}
//# sourceMappingURL=resolve-tool-node-type.js.map