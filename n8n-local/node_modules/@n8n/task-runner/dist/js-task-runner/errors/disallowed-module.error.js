"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisallowedModuleError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DisallowedModuleError extends n8n_workflow_1.UserError {
    constructor(moduleName) {
        super(`Module '${moduleName}' is disallowed`);
    }
}
exports.DisallowedModuleError = DisallowedModuleError;
//# sourceMappingURL=disallowed-module.error.js.map