"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalMockedCredentialsHelper = exports.EVAL_PROVIDER_URL_FIELD = void 0;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credential_not_found_error_1 = require("../../../errors/credential-not-found.error");
const workflow_analysis_1 = require("./workflow-analysis");
const MOCK_MARKER = '__evalMockedCredential';
exports.EVAL_PROVIDER_URL_FIELD = {
    openAiApi: { field: 'url', pathPrefix: '/v1' },
};
function getCredentialId(nodeCredentials) {
    return nodeCredentials.id ? nodeCredentials.id : undefined;
}
class EvalMockedCredentialsHelper extends n8n_workflow_1.ICredentialsHelper {
    constructor(inner, serverUrl, logger, subNodeToRoot) {
        super();
        this.inner = inner;
        this.serverUrl = serverUrl;
        this.logger = logger;
        this.subNodeToRoot = subNodeToRoot;
        this.mockedCredentials = [];
        this.rewrittenCredentials = [];
        this.interceptionGaps = [];
    }
    getParentTypes(name) {
        return this.inner.getParentTypes(name);
    }
    async authenticate(credentials, typeName, requestOptions, workflow, node) {
        if (credentials[MOCK_MARKER] === true) {
            return requestOptions;
        }
        return await this.inner.authenticate(credentials, typeName, requestOptions, workflow, node);
    }
    async preAuthentication(helpers, credentials, typeName, node, credentialsExpired) {
        if (credentials[MOCK_MARKER] === true)
            return credentials;
        return await this.inner.preAuthentication(helpers, credentials, typeName, node, credentialsExpired);
    }
    async runPreAuthentication(helpers, credentials, typeName) {
        if (credentials[MOCK_MARKER] === true)
            return credentials;
        return await this.inner.runPreAuthentication(helpers, credentials, typeName);
    }
    async getCredentials(nodeCredentials, type) {
        return await this.inner.getCredentials(nodeCredentials, type);
    }
    async getDecrypted(additionalData, nodeCredentials, type, mode, executeData, raw, expressionResolveValues, options) {
        if (!nodeCredentials.id) {
            this.mockedCredentials.push({
                nodeName: executeData?.node?.name ?? 'unknown',
                credentialType: type,
                credentialId: undefined,
            });
            const synthesized = {
                ...(0, n8n_core_1.buildEvalMockCredentials)(this.inner.getCredentialsProperties(type)),
                [MOCK_MARKER]: true,
            };
            return this.applyServerUrlRewrite(synthesized, type, nodeCredentials, executeData);
        }
        let credentials;
        try {
            credentials = await this.inner.getDecrypted(additionalData, nodeCredentials, type, mode, executeData, raw, expressionResolveValues, options);
        }
        catch (error) {
            if (!(error instanceof credential_not_found_error_1.CredentialNotFoundError))
                throw error;
            this.mockedCredentials.push({
                nodeName: executeData?.node?.name ?? 'unknown',
                credentialType: type,
                credentialId: getCredentialId(nodeCredentials),
            });
            credentials = { [MOCK_MARKER]: true };
        }
        return this.applyServerUrlRewrite(credentials, type, nodeCredentials, executeData);
    }
    recordInterceptionGap(node, reason) {
        if (!node || !(0, workflow_analysis_1.isVendorSdkSubNode)(node.type))
            return;
        const message = `Vendor sub-node "${node.name}" (${node.type}) executed without interception — ${reason}. ` +
            'Its model/embedding call did not reach the mock layer, so this scenario did not exercise the built workflow.';
        if (!this.interceptionGaps.includes(message))
            this.interceptionGaps.push(message);
    }
    applyServerUrlRewrite(credentials, type, nodeCredentials, executeData) {
        if (!this.serverUrl) {
            this.recordInterceptionGap(executeData?.node, 'vendor SDK interception is not active for this run');
            return credentials;
        }
        const mapping = exports.EVAL_PROVIDER_URL_FIELD[type];
        if (!mapping) {
            this.recordInterceptionGap(executeData?.node, `credential type "${type}" has no wire-server URL rewrite mapping`);
            this.logger.warn(`[EvalMock] No URL rewrite mapping for credential type "${type}" — ` +
                `vendor traffic from "${executeData?.node?.name ?? 'unknown'}" will hit the real provider.`);
            return credentials;
        }
        const { field, pathPrefix } = mapping;
        const subNodeName = executeData?.node?.name;
        const rootName = subNodeName ? this.subNodeToRoot?.get(subNodeName) : undefined;
        if (subNodeName && !rootName && this.subNodeToRoot) {
            this.recordInterceptionGap(executeData?.node, 'it has no vendor LLM routing entry, so its traffic reaches the wire server unrouted');
            this.logger.warn(`[EvalMock] No vendor LLM routing entry for sub-node "${subNodeName}" — ` +
                'wire-server attribution will be unrouted. Check buildVendorLlmRouting coverage.');
        }
        this.rewrittenCredentials.push({
            nodeName: subNodeName ?? 'unknown',
            credentialType: type,
            credentialId: getCredentialId(nodeCredentials),
            field,
        });
        const rewrittenUrl = rootName
            ? `${this.serverUrl}/eval/${encodeURIComponent(rootName)}${pathPrefix}`
            : `${this.serverUrl}${pathPrefix}`;
        return { ...credentials, [field]: rewrittenUrl };
    }
    async updateCredentials(nodeCredentials, type, data) {
        return await this.inner.updateCredentials(nodeCredentials, type, data);
    }
    async updateCredentialsOauthTokenData(nodeCredentials, type, data, additionalData) {
        return await this.inner.updateCredentialsOauthTokenData(nodeCredentials, type, data, additionalData);
    }
    getCredentialsProperties(type) {
        return this.inner.getCredentialsProperties(type);
    }
    isCredentialUsableByNode(credentialType, nodeType) {
        return this.inner.isCredentialUsableByNode(credentialType, nodeType);
    }
}
exports.EvalMockedCredentialsHelper = EvalMockedCredentialsHelper;
//# sourceMappingURL=eval-mocked-credentials-helper.js.map