"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUninstalledNodeWarnings = buildUninstalledNodeWarnings;
const mcp_constants_1 = require("../../mcp.constants");
async function buildUninstalledNodeWarnings(nodes, findUninstalledNodeTypes, installToolAvailable) {
    if (!findUninstalledNodeTypes || nodes.length === 0)
        return [];
    const uninstalled = await findUninstalledNodeTypes(nodes.map((node) => node.type));
    if (uninstalled.length === 0)
        return [];
    const packagesByNodeType = new Map(uninstalled.map((entry) => [entry.nodeType, entry.packageName]));
    const followUp = installToolAvailable
        ? `Tell the user, and offer to install it with ${mcp_constants_1.INSTALL_COMMUNITY_NODE_TOOL.toolName}.`
        : 'Tell the user; an administrator of this instance must install the package.';
    return nodes
        .filter((node) => packagesByNodeType.has(node.type))
        .map((node) => ({
        code: 'UNINSTALLED_COMMUNITY_NODE',
        message: `'${node.type}' ships in the verified community package '${packagesByNodeType.get(node.type)}', which is not installed on this instance. The workflow cannot run, and its credentials cannot be created, until it is installed. ${followUp}`,
        nodeName: node.name,
    }));
}
//# sourceMappingURL=uninstalled-node-warnings.js.map