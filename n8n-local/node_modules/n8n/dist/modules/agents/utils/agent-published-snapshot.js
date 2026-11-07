"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAgentRunSource = resolveAgentRunSource;
const n8n_workflow_1 = require("n8n-workflow");
function getPublishedVersion(agentEntity) {
    const activeVersion = agentEntity.activeVersion;
    if (!activeVersion?.schema) {
        throw new n8n_workflow_1.OperationalError('Agent is not published. Publish the agent before using it in a workflow.');
    }
    return activeVersion;
}
function getPublishedAgentSnapshot(agentEntity) {
    const activeVersion = getPublishedVersion(agentEntity);
    return {
        ...agentEntity,
        schema: activeVersion.schema,
        tools: activeVersion.tools ?? {},
    };
}
async function resolveAgentRunSource(agentEntity, usePublishedVersion, agentSkillRefs, ctx) {
    if (!usePublishedVersion) {
        return { agent: agentEntity, ...(await agentSkillRefs.readDraft(agentEntity, ctx)) };
    }
    const activeVersion = getPublishedVersion(agentEntity);
    return {
        agent: getPublishedAgentSnapshot(agentEntity),
        ...(await agentSkillRefs.readVersion(activeVersion, ctx)),
    };
}
//# sourceMappingURL=agent-published-snapshot.js.map