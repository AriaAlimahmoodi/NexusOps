"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNodeConfig = extractNodeConfig;
function extractNodeConfig(node) {
    const params = node.parameters;
    if (!params || typeof params !== 'object')
        return '';
    try {
        return JSON.stringify(params);
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=node-config.js.map