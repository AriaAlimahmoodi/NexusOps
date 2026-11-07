"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserScopedSlot = getUserScopedSlot;
exports.ensureUserId = ensureUserId;
const n8n_workflow_1 = require("n8n-workflow");
function getUserScopedSlot(context, prefix, itemIndex) {
    const userId = ensureUserId(context, itemIndex);
    return `${prefix}_${userId}`.replace(/[^a-zA-Z0-9_]/g, '_');
}
function ensureUserId(context, itemIndex) {
    const userId = 'additionalData' in context &&
        typeof context.additionalData === 'object' &&
        context.additionalData !== null &&
        'userId' in context.additionalData
        ? context.additionalData.userId
        : undefined;
    if (typeof userId !== 'string' || !userId) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'User ID is not available. This node requires an authenticated user session.', { itemIndex });
    }
    return userId;
}
//# sourceMappingURL=userScoped.js.map