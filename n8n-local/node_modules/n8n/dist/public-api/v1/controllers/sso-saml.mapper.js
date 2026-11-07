"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSamlConfigurationResponse = toSamlConfigurationResponse;
exports.toSamlPreferencesUpdate = toSamlPreferencesUpdate;
const n8n_workflow_1 = require("n8n-workflow");
const service_provider_ee_1 = require("../../../modules/sso-saml/service-provider.ee");
function toSamlConfigurationResponse(prefs) {
    return {
        mapping: {
            email: prefs.mapping?.email ?? '',
            firstName: prefs.mapping?.firstName ?? '',
            lastName: prefs.mapping?.lastName ?? '',
            userPrincipalName: prefs.mapping?.userPrincipalName ?? '',
            emailVerified: prefs.mapping?.emailVerified ?? '',
            n8nInstanceRole: prefs.mapping?.n8nInstanceRole ?? '',
            n8nProjectRoles: prefs.mapping?.n8nProjectRoles ?? [],
        },
        metadata: prefs.metadata ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : '',
        metadataUrl: prefs.metadataUrl ?? '',
        ignoreSSL: prefs.ignoreSSL ?? false,
        loginBinding: prefs.loginBinding ?? 'redirect',
        loginEnabled: prefs.loginEnabled ?? false,
        loginLabel: prefs.loginLabel ?? '',
        authnRequestsSigned: prefs.authnRequestsSigned ?? false,
        wantAssertionsSigned: prefs.wantAssertionsSigned ?? true,
        wantMessageSigned: prefs.wantMessageSigned ?? true,
        emailVerifiedRequired: prefs.emailVerifiedRequired ?? false,
        signingPrivateKey: prefs.signingPrivateKey ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : '',
        signingCertificate: prefs.signingCertificate ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : '',
        acsBinding: prefs.acsBinding ?? 'post',
        signatureConfig: prefs.signatureConfig ?? {
            prefix: 'ds',
            location: {
                reference: '/samlp:Response/saml:Issuer',
                action: 'after',
            },
        },
        relayState: prefs.relayState ?? '',
        entityID: (0, service_provider_ee_1.getServiceProviderEntityId)(),
        returnUrl: (0, service_provider_ee_1.getServiceProviderReturnUrl)(),
    };
}
function toSamlPreferencesUpdate(data) {
    const { entityID: _entityID, returnUrl: _returnUrl, metadata, signingCertificate, signingPrivateKey, ...writable } = data;
    return {
        ...writable,
        ...(metadata === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE ? {} : { metadata }),
        ...(signingCertificate === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE ? {} : { signingCertificate }),
        ...(signingPrivateKey === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE ? {} : { signingPrivateKey }),
    };
}
//# sourceMappingURL=sso-saml.mapper.js.map