"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAgentCredentialIds = extractAgentCredentialIds;
const api_types_1 = require("@n8n/api-types");
const visit_agent_credential_references_1 = require("./visit-agent-credential-references");
const MANAGED_CREDENTIAL_IDS = new Set([api_types_1.MANAGED_CREDENTIAL_TOKEN, api_types_1.AI_GATEWAY_MANAGED_TAG]);
function extractAgentCredentialIds(config) {
    const credentialIds = new Set();
    (0, visit_agent_credential_references_1.visitAgentCredentialReferences)(config, ({ id }) => {
        if (id !== '' && !MANAGED_CREDENTIAL_IDS.has(id))
            credentialIds.add(id);
    });
    return credentialIds;
}
//# sourceMappingURL=extract-agent-credential-ids.js.map