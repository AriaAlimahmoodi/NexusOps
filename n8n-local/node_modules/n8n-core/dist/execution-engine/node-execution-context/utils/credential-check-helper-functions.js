"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialCheckHelperFunctions = getCredentialCheckHelperFunctions;
function getCredentialCheckHelperFunctions(additionalData) {
    const credentialCheckProxy = additionalData['dynamic-credentials']?.credentialCheckProxy;
    if (!credentialCheckProxy)
        return {};
    return {
        checkCredentialStatus: async (workflowId, executionContext) => await credentialCheckProxy.checkCredentialStatus(workflowId, executionContext),
    };
}
//# sourceMappingURL=credential-check-helper-functions.js.map