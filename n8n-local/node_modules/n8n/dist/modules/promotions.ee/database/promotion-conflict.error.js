"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionConflictError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class PromotionConflictError extends n8n_workflow_1.UserError {
    constructor(kind, message) {
        super(message);
        this.kind = kind;
    }
}
exports.PromotionConflictError = PromotionConflictError;
//# sourceMappingURL=promotion-conflict.error.js.map