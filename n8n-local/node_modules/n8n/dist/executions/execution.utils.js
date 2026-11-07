"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowActiveStatusFromWorkflowData = getWorkflowActiveStatusFromWorkflowData;
exports.isManualOrChatExecution = isManualOrChatExecution;
function getWorkflowActiveStatusFromWorkflowData(workflowData) {
    return !!workflowData.activeVersionId || workflowData.active;
}
function isManualOrChatExecution(executionMode) {
    if (!executionMode)
        return false;
    return ['manual', 'chat'].includes(executionMode);
}
//# sourceMappingURL=execution.utils.js.map