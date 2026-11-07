"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBuiltinNodeDefinitionDirs = resolveBuiltinNodeDefinitionDirs;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function resolveBuiltinNodeDefinitionDirs() {
    const dirs = [];
    for (const packageId of constants_1.BUILTIN_NODES_PACKAGES) {
        try {
            const packageJsonPath = require.resolve(`${packageId}/package.json`);
            const distDir = (0, node_path_1.dirname)(packageJsonPath);
            const nodeDefsDir = (0, backend_common_1.safeJoinPath)(distDir, 'dist', 'node-definitions');
            if ((0, node_fs_1.existsSync)(nodeDefsDir)) {
                dirs.push(nodeDefsDir);
            }
        }
        catch {
        }
    }
    return dirs;
}
//# sourceMappingURL=node-definition-dirs.js.map