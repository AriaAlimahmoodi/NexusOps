"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTool = isTool;
function isTool(nodeType) {
    return nodeType.codex?.subcategories?.AI?.includes('Tools') ?? false;
}
//# sourceMappingURL=is-tool.js.map