"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThreadId = generateThreadId;
function generateThreadId(workflowId, userId, agentType) {
    const baseId = workflowId
        ? `workflow-${workflowId}-user-${userId ?? new Date().getTime()}`
        : crypto.randomUUID();
    return agentType === 'code-builder' ? `${baseId}-code` : baseId;
}
//# sourceMappingURL=thread-id.js.map