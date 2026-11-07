"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARENT_TASK_CANCELLED_REASON = exports.BACKGROUND_PAUSE_USER_TURN_KEY = exports.BACKGROUND_APPROVAL_RUN_PREFIX = exports.BACKGROUND_SUB_AGENT_METADATA_KEY = void 0;
exports.parseBackgroundApprovalAction = parseBackgroundApprovalAction;
exports.readBackgroundSubAgentState = readBackgroundSubAgentState;
const agents_1 = require("@n8n/agents");
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const integration_message_context_1 = require("../integrations/integration-message-context");
exports.BACKGROUND_SUB_AGENT_METADATA_KEY = 'n8nBackgroundSubAgent';
exports.BACKGROUND_APPROVAL_RUN_PREFIX = 'background-job-';
exports.BACKGROUND_PAUSE_USER_TURN_KEY = 'n8nBackgroundPauseUserTurn';
exports.PARENT_TASK_CANCELLED_REASON = new DOMException('Parent task cancelled', 'AbortError');
function parseBackgroundApprovalAction(actionId) {
    const match = /^bg:([a-f\d-]{36}):([\w-]{22}):([01s])$/i.exec(actionId);
    if (!match)
        return undefined;
    const decision = match[3].toLowerCase();
    const resumeData = { approved: decision !== '0' };
    if (decision === 's')
        resumeData.scope = 'session';
    return {
        runId: `${exports.BACKGROUND_APPROVAL_RUN_PREFIX}${match[1]}`,
        toolCallId: match[2],
        resumeData,
    };
}
const backgroundStateSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1),
    taskPath: zod_1.z.string(),
    resumeContext: zod_1.z.object({ agentId: zod_1.z.string().min(1), versionId: zod_1.z.string().min(1).optional() }),
    runtimeSnapshot: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(api_types_1.SUB_AGENT_TASK_DIFFICULTIES).optional(),
    sharedWorkspace: zod_1.z.boolean(),
    messageContext: zod_1.z.custom(integration_message_context_1.isIntegrationMessageContext).nullable(),
});
function readBackgroundSubAgentState(checkpoint) {
    const parsed = backgroundStateSchema.safeParse(checkpoint.persistence?.hostMetadata?.[exports.BACKGROUND_SUB_AGENT_METADATA_KEY]);
    if (!parsed.success)
        return undefined;
    const { taskPath } = parsed.data;
    try {
        (0, agents_1.assertSubAgentTaskPath)(taskPath);
    }
    catch {
        return undefined;
    }
    return { ...parsed.data, taskPath };
}
//# sourceMappingURL=sub-agent-background-state.js.map