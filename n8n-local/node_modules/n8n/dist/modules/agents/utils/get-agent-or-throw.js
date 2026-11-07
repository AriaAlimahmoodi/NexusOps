"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentOrThrow = getAgentOrThrow;
const errors_1 = require("@n8n/errors");
async function getAgentOrThrow(repository, agentId, projectId, message = `Agent "${agentId}" not found`) {
    const agent = await repository.findByIdAndProjectId(agentId, projectId);
    if (!agent)
        throw new errors_1.NotFoundError(message);
    return agent;
}
//# sourceMappingURL=get-agent-or-throw.js.map