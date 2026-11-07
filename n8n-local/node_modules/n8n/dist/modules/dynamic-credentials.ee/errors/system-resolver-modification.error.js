"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemResolverModificationError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class SystemResolverModificationError extends n8n_workflow_1.UserError {
    constructor(action) {
        super(`Cannot ${action} the system credential resolver.`);
    }
}
exports.SystemResolverModificationError = SystemResolverModificationError;
//# sourceMappingURL=system-resolver-modification.error.js.map