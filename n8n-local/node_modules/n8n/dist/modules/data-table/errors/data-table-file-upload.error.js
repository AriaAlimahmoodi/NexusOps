"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class FileUploadError extends n8n_workflow_1.UserError {
    constructor(msg) {
        super(`Error uploading file: ${msg}`, {
            level: 'warning',
        });
    }
}
exports.FileUploadError = FileUploadError;
//# sourceMappingURL=data-table-file-upload.error.js.map