"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedExecutionStrategy = void 0;
const DEFAULT_TIMEOUT_MS = 120000;
class QueuedExecutionStrategy {
    constructor(pendingCalls, timeoutMs = DEFAULT_TIMEOUT_MS) {
        this.pendingCalls = pendingCalls;
        this.timeoutMs = timeoutMs;
    }
    async executeTool(tool, args, context) {
        const callId = `${context.sessionId}_${context.messageId ?? 'default'}`;
        return await this.pendingCalls.waitForResult(callId, tool.name, args, this.timeoutMs);
    }
    resolveToolCall(callId, result) {
        return this.pendingCalls.resolve(callId, result);
    }
    rejectToolCall(callId, error) {
        return this.pendingCalls.reject(callId, error);
    }
    getPendingCallsManager() {
        return this.pendingCalls;
    }
}
exports.QueuedExecutionStrategy = QueuedExecutionStrategy;
//# sourceMappingURL=QueuedExecutionStrategy.js.map