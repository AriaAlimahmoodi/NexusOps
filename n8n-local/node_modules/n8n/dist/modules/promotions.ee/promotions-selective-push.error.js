"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsWorkflowsMovedCrossProjectError = void 0;
const api_types_1 = require("@n8n/api-types");
const errors_1 = require("@n8n/errors");
class PromotionsWorkflowsMovedCrossProjectError extends errors_1.BadRequestError {
    constructor(workflowIds) {
        super(`These workflows moved to another project: ${workflowIds.join(', ')}. A selective push cannot move them. Push all projects instead.`);
        this.meta = {
            code: api_types_1.PROMOTIONS_WORKFLOWS_MOVED_CROSS_PROJECT_CODE,
            workflowIds,
        };
    }
}
exports.PromotionsWorkflowsMovedCrossProjectError = PromotionsWorkflowsMovedCrossProjectError;
//# sourceMappingURL=promotions-selective-push.error.js.map