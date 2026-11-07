"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueName = generateUniqueName;
exports.getLatestVersion = getLatestVersion;
exports.generateNodeId = generateNodeId;
exports.createNodeInstance = createNodeInstance;
exports.mergeWithDefaults = mergeWithDefaults;
const n8n_workflow_1 = require("n8n-workflow");
function generateUniqueName(baseName, existingNodes) {
    let uniqueName = baseName;
    let counter = 1;
    while (existingNodes.some((n) => n.name === uniqueName)) {
        uniqueName = `${baseName}${counter}`;
        counter++;
    }
    return uniqueName;
}
function getLatestVersion(nodeType) {
    return (nodeType.defaultVersion ??
        (typeof nodeType.version === 'number'
            ? nodeType.version
            : nodeType.version[nodeType.version.length - 1]));
}
function generateNodeId() {
    return crypto.randomUUID();
}
function createNodeInstance(nodeType, typeVersion, name, position, parameters = {}, id, nodeSettings) {
    (0, n8n_workflow_1.assert)(Array.isArray(nodeType.version)
        ? nodeType.version.includes(typeVersion)
        : typeVersion === nodeType.version);
    const node = {
        id: id ?? generateNodeId(),
        name,
        type: nodeType.name,
        typeVersion,
        position,
        parameters,
        ...nodeSettings,
    };
    (0, n8n_workflow_1.resolveNodeWebhookId)(node, nodeType);
    return node;
}
function mergeWithDefaults(parameters, nodeType) {
    const defaults = nodeType.defaults || {};
    return { ...defaults, ...parameters };
}
//# sourceMappingURL=node-creation.utils.js.map