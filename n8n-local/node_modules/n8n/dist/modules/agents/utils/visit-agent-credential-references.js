"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitAgentCredentialReferences = visitAgentCredentialReferences;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const CREDENTIAL_LOCATIONS = [
    { path: ['credential'], managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG },
    { path: ['memory', 'episodicMemory', 'credential'], managedToken: api_types_1.MANAGED_CREDENTIAL_TOKEN },
    {
        path: ['memory', 'observationalMemory', 'observerModel', 'credential'],
        managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG,
    },
    {
        path: ['memory', 'observationalMemory', 'reflectorModel', 'credential'],
        managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG,
    },
    {
        path: ['memory', 'episodicMemory', 'reflectorModel', 'credential'],
        managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG,
    },
    ...api_types_1.SUB_AGENT_TASK_DIFFICULTIES.map((difficulty) => ({
        path: ['subAgents', 'modelsByDifficulty', difficulty, 'credential'],
        managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG,
    })),
    { path: ['config', 'webSearch', 'credential'], managedToken: api_types_1.AI_GATEWAY_MANAGED_TAG },
    { path: ['integrations', '[]', 'credentialId'] },
    { path: ['mcpServers', '[]', 'credential'] },
    { path: ['vectorStores', '[]', 'credential'] },
    { path: ['vectorStores', '[]', 'embedding', 'credential'] },
    { path: ['tools', '[]', 'node', 'credentials', '*', 'id'] },
];
function visitLocation(value, [key, ...rest], visit, managedToken) {
    if (key === '[]') {
        if (Array.isArray(value)) {
            for (const entry of value)
                visitLocation(entry, rest, visit, managedToken);
        }
        return;
    }
    if (!(0, is_record_1.isRecord)(value))
        return;
    if (key === '*') {
        for (const entry of Object.values(value))
            visitLocation(entry, rest, visit, managedToken);
        return;
    }
    if (rest.length > 0) {
        visitLocation(value[key], rest, visit, managedToken);
        return;
    }
    const id = value[key];
    if (typeof id === 'string') {
        visit({
            id,
            managedToken,
            setId: (nextId) => {
                value[key] = nextId;
            },
        });
    }
}
function visitAgentCredentialReferences(config, visit) {
    for (const { path, managedToken } of CREDENTIAL_LOCATIONS) {
        visitLocation(config, path, visit, managedToken);
    }
}
//# sourceMappingURL=visit-agent-credential-references.js.map