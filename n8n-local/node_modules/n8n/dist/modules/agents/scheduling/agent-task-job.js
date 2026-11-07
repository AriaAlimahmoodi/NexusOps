"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgentTaskJobPayload = exports.AGENT_TASK_TASK_TYPE = void 0;
exports.agentTaskJobName = agentTaskJobName;
exports.AGENT_TASK_TASK_TYPE = 'agent:scheduled-task';
const isNonEmptyString = (value) => typeof value === 'string' && value !== '';
const isAgentTaskJobPayload = (payload) => isNonEmptyString(payload.agentId) && isNonEmptyString(payload.taskId);
exports.isAgentTaskJobPayload = isAgentTaskJobPayload;
function agentTaskJobName(agentId, taskId) {
    return `agent-task:${agentId}:${taskId}`;
}
//# sourceMappingURL=agent-task-job.js.map