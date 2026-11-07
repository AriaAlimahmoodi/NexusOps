"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutionRecordingError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AgentExecutionRecordingError extends n8n_workflow_1.OperationalError {
    constructor(failure) {
        super(failure.phase === 'create'
            ? 'Failed to create the agent execution record.'
            : 'Failed to finalize the agent execution record.', { cause: failure.cause });
        this.phase = failure.phase;
        this.executionId = failure.executionId;
        this.executionStarted = failure.executionStarted ?? false;
        this.executionError = failure.executionError;
    }
}
exports.AgentExecutionRecordingError = AgentExecutionRecordingError;
//# sourceMappingURL=agent-execution-recording.error.js.map