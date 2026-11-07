"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgentSandboxPrincipalHash = isAgentSandboxPrincipalHash;
exports.encodeAgentSandboxHostMetadata = encodeAgentSandboxHostMetadata;
exports.decodeAgentSandboxHostMetadata = decodeAgentSandboxHostMetadata;
exports.hashAgentSandboxPrincipal = hashAgentSandboxPrincipal;
const node_crypto_1 = require("node:crypto");
const AGENT_SANDBOX_HOST_METADATA_KEY = 'n8nAgentSandbox';
function isAgentSandboxPrincipalHash(value) {
    return /^[A-Za-z0-9_-]{43}$/.test(value);
}
function encodeAgentSandboxHostMetadata(scope) {
    return {
        [AGENT_SANDBOX_HOST_METADATA_KEY]: {
            projectId: scope.projectId,
            principalHash: scope.principalHash,
        },
    };
}
function decodeAgentSandboxHostMetadata(hostMetadata) {
    const scope = hostMetadata?.[AGENT_SANDBOX_HOST_METADATA_KEY];
    if (typeof scope !== 'object' ||
        scope === null ||
        Array.isArray(scope) ||
        Object.keys(scope).length !== 2) {
        return undefined;
    }
    const { projectId, principalHash } = scope;
    if (typeof projectId !== 'string' ||
        typeof principalHash !== 'string' ||
        !isAgentSandboxPrincipalHash(principalHash)) {
        return undefined;
    }
    return { projectId, principalHash };
}
function hashAgentSandboxPrincipal(principal) {
    let canonicalPrincipal;
    switch (principal.type) {
        case 'n8n-user':
            canonicalPrincipal = [principal.type, principal.userId];
            break;
        case 'integration-thread':
            canonicalPrincipal = [
                principal.type,
                principal.connectionId,
                principal.platform,
                principal.platformThreadId,
            ];
            break;
        case 'project-session':
            canonicalPrincipal = [principal.type, principal.projectId, principal.sessionId];
            break;
        case 'workflow-execution':
            canonicalPrincipal = [principal.type, principal.workflowId, principal.executionId];
            break;
        case 'scheduled-task':
            canonicalPrincipal = [principal.type, principal.taskId];
            break;
    }
    return (0, node_crypto_1.createHash)('sha256')
        .update(JSON.stringify(canonicalPrincipal))
        .digest('base64url');
}
//# sourceMappingURL=agent-sandbox-principal.js.map