"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUnknownAgentCredentials = sanitizeUnknownAgentCredentials;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const visit_agent_credential_references_1 = require("../utils/visit-agent-credential-references");
function sanitizeUnknownAgentCredentials(raw, accessibleCredentialIds) {
    if (!(0, is_record_1.isRecord)(raw))
        return raw;
    const sanitized = structuredClone(raw);
    (0, visit_agent_credential_references_1.visitAgentCredentialReferences)(sanitized, ({ id, setId, managedToken }) => {
        if (id !== managedToken && !accessibleCredentialIds.has(id))
            setId('');
    });
    const model = typeof sanitized.model === 'string' ? sanitized.model : undefined;
    if ((0, api_types_1.isDraftAgentConfig)({ model }) && typeof sanitized.credential === 'string') {
        sanitized.credential = '';
    }
    return sanitized;
}
//# sourceMappingURL=sanitize-unknown-agent-credentials.js.map