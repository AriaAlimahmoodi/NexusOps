"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowNodeTaskPayload = void 0;
const isNonEmptyString = (value) => typeof value === 'string' && value !== '';
const isWorkflowNodeTaskPayload = (payload) => isNonEmptyString(payload.workflowId) && isNonEmptyString(payload.nodeId);
exports.isWorkflowNodeTaskPayload = isWorkflowNodeTaskPayload;
//# sourceMappingURL=workflow-node-task-payload.js.map