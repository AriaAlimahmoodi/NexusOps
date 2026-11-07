"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryPackageWriter = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
function normaliseEntryPath(entryPath) {
    return entryPath.startsWith('./') ? entryPath.slice(2) : entryPath;
}
class DirectoryPackageWriter {
    constructor(targetDir) {
        this.targetDir = targetDir;
    }
    async writeFile(entryPath, content) {
        const destination = this.resolveWithin(this.targetDir, normaliseEntryPath(entryPath));
        await (0, promises_1.mkdir)(node_path_1.default.dirname(destination), { recursive: true });
        await (0, promises_1.writeFile)(destination, content);
    }
    async writeDirectory(entryPath) {
        const destination = this.resolveWithin(this.targetDir, normaliseEntryPath(entryPath));
        await (0, promises_1.mkdir)(destination, { recursive: true });
    }
    async finalize() {
        return;
    }
    resolveWithin(baseDir, entryPath) {
        const destination = node_path_1.default.resolve(baseDir, entryPath);
        const relative = node_path_1.default.relative(baseDir, destination);
        if (relative === '' || relative.startsWith('..') || node_path_1.default.isAbsolute(relative)) {
            throw new n8n_workflow_1.UnexpectedError(`Refusing to write package entry outside the target: ${entryPath}`);
        }
        return destination;
    }
}
exports.DirectoryPackageWriter = DirectoryPackageWriter;
//# sourceMappingURL=directory-package-writer.js.map