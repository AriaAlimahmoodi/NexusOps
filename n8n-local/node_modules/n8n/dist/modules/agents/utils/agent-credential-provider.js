"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentCredentialProvider = createAgentCredentialProvider;
const agents_credential_provider_1 = require("../adapters/agents-credential-provider");
function createAgentCredentialProvider(credentialsService, projectId, user, agentId) {
    return new agents_credential_provider_1.AgentsCredentialProvider(credentialsService, projectId, user, agentId);
}
//# sourceMappingURL=agent-credential-provider.js.map