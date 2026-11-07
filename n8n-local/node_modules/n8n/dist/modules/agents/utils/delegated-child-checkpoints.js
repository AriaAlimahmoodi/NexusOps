"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDelegatedChildCheckpoints = getDelegatedChildCheckpoints;
const agents_1 = require("@n8n/agents");
const is_record_1 = require("@n8n/utils/is-record");
function getDelegatedChildCheckpoints(checkpoint, parentAgentId) {
    const childCheckpoints = [];
    const seen = new Set();
    for (const pendingToolCall of Object.values(checkpoint.pendingToolCalls)) {
        if (!pendingToolCall.suspended)
            continue;
        const childCheckpoint = (0, agents_1.parseDelegateSubAgentContinuation)(pendingToolCall.continuation);
        if (!childCheckpoint)
            continue;
        let ownerAgentId;
        if (childCheckpoint.resumeContext === undefined) {
            if (childCheckpoint.subAgentId !== agents_1.INLINE_SUB_AGENT_ID)
                continue;
            ownerAgentId = parentAgentId;
        }
        else {
            if (!(0, is_record_1.isRecord)(childCheckpoint.resumeContext) ||
                typeof childCheckpoint.resumeContext.agentId !== 'string' ||
                childCheckpoint.resumeContext.agentId.length === 0 ||
                (childCheckpoint.resumeContext.versionId !== undefined &&
                    (typeof childCheckpoint.resumeContext.versionId !== 'string' ||
                        childCheckpoint.resumeContext.versionId.length === 0))) {
                continue;
            }
            const expectedOwnerAgentId = childCheckpoint.subAgentId === agents_1.INLINE_SUB_AGENT_ID
                ? parentAgentId
                : childCheckpoint.subAgentId;
            if (childCheckpoint.resumeContext.agentId !== expectedOwnerAgentId)
                continue;
            ownerAgentId = expectedOwnerAgentId;
        }
        const identity = `${ownerAgentId}\0${childCheckpoint.runId}`;
        if (seen.has(identity))
            continue;
        seen.add(identity);
        childCheckpoints.push({ runId: childCheckpoint.runId, agentId: ownerAgentId });
    }
    return childCheckpoints;
}
//# sourceMappingURL=delegated-child-checkpoints.js.map