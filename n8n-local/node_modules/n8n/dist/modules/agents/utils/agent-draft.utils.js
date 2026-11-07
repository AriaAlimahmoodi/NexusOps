"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAgentDraftDirty = markAgentDraftDirty;
exports.saveAgentDraftFenced = saveAgentDraftFenced;
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
function markAgentDraftDirty(agent) {
    if (agent.versionId !== null && agent.versionId === agent.activeVersionId) {
        agent.versionId = (0, uuid_1.v4)();
    }
}
async function saveAgentDraftFenced(agentRepository, agent, ctx = {}) {
    const won = await agentRepository.saveDraftFenced(agent, ctx);
    if (!won) {
        throw new errors_1.ConflictError('Agent was modified concurrently; please retry');
    }
    return agent;
}
//# sourceMappingURL=agent-draft.utils.js.map