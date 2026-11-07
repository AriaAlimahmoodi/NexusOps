"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoragePathError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class StoragePathError extends n8n_workflow_1.UserError {
    static conflict() {
        return new StoragePathError('Both N8N_STORAGE_PATH and N8N_BINARY_DATA_STORAGE_PATH cannot be set to different values. N8N_BINARY_DATA_STORAGE_PATH is deprecated. Please set only N8N_STORAGE_PATH.');
    }
    static taken(oldPath, newPath) {
        return new StoragePathError(`Failed to migrate ${oldPath} to ${newPath} because ${newPath} already exists. Please rename ${newPath} so n8n can migrate ${oldPath} to this path.`);
    }
}
exports.StoragePathError = StoragePathError;
//# sourceMappingURL=storage-path-conflict.error.js.map