"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopeCredentialProvider = scopeCredentialProvider;
function scopeCredentialProvider(provider, getAllowedCredentialIds) {
    const gateway = provider.resolveAiGatewayModelCredential?.bind(provider);
    return {
        resolve: async (credentialId) => await provider.resolve(credentialId),
        list: async () => {
            const allowedIds = getAllowedCredentialIds();
            const listed = await provider.list();
            if (allowedIds === undefined)
                return listed;
            const allowed = new Set(allowedIds);
            return listed.filter((credential) => allowed.has(credential.id));
        },
        ...(gateway ? { resolveAiGatewayModelCredential: gateway } : {}),
    };
}
//# sourceMappingURL=scoped-credential-provider.js.map