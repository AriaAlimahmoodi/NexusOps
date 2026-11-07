"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeTypeMap = createNodeTypeMap;
exports.getNodeTypeForNode = getNodeTypeForNode;
exports.createNodeTypeMaps = createNodeTypeMaps;
function getNodeTypeVersions(nodeType) {
    const version = nodeType.version;
    if (typeof version === 'number') {
        return [version];
    }
    if (Array.isArray(version) && version.length > 0 && typeof version[0] === 'number') {
        return version;
    }
    return [1];
}
function getDefaultVersion(nodeType) {
    const defaultVersion = nodeType.defaultVersion;
    if (typeof defaultVersion === 'number') {
        return defaultVersion;
    }
    const versions = getNodeTypeVersions(nodeType);
    return Math.max(...versions);
}
function createNodeTypeMap(nodeTypes) {
    return new Map(nodeTypes.flatMap((nodeType) => {
        const versions = getNodeTypeVersions(nodeType);
        return versions.map((version) => [`${nodeType.name}-${version}`, nodeType]);
    }));
}
function resolveNodeVersion(node, nodeTypesByName) {
    if (node.typeVersion !== undefined) {
        return node.typeVersion;
    }
    const nodeType = nodeTypesByName.get(node.type);
    if (nodeType) {
        return getDefaultVersion(nodeType);
    }
    return 1;
}
function getNodeTypeForNode(node, nodeTypeMap, nodeTypesByName) {
    const version = resolveNodeVersion(node, nodeTypesByName);
    return nodeTypeMap.get(`${node.type}-${version}`);
}
function createNodeTypeMaps(nodeTypes) {
    const nodeTypesArray = Array.from(nodeTypes);
    const nodeTypeMap = createNodeTypeMap(nodeTypesArray);
    const nodeTypesByName = new Map(nodeTypesArray.map((type) => [type.name, type]));
    return { nodeTypeMap, nodeTypesByName };
}
//# sourceMappingURL=node-type-map.js.map