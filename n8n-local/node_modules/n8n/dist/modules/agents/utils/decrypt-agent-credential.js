"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptAgentCredential = decryptAgentCredential;
async function decryptAgentCredential(credentialsHelper, credential, scope) {
    const { getBase } = await import('../../../workflow-execute-additional-data.js');
    const additionalData = await getBase(scope);
    return await credentialsHelper.getDecrypted(additionalData, { id: credential.id, name: credential.name }, credential.type, 'internal');
}
//# sourceMappingURL=decrypt-agent-credential.js.map