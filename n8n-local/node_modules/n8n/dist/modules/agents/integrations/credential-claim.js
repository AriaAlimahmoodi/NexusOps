"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCredentialNotClaimed = assertCredentialNotClaimed;
const errors_1 = require("@n8n/errors");
async function assertCredentialNotClaimed(agentRepository, displayLabel, type, ctx) {
    const others = await agentRepository.findByIntegrationCredential(type, ctx.credentialId, ctx.projectId, ctx.agentId);
    if (others.length === 0)
        return;
    throw new errors_1.ConflictError(`This ${displayLabel} credential is already connected to agent "${others[0].name}". ` +
        `Disconnect the channel there, or connect this agent with a different ${displayLabel} credential.`);
}
//# sourceMappingURL=credential-claim.js.map