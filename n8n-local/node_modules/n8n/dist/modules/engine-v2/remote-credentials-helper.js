"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteCredentialsHelper = void 0;
const engine_1 = require("@n8n/engine");
const n8n_workflow_1 = require("n8n-workflow");
class RemoteCredentialsHelper extends n8n_workflow_1.ICredentialsHelper {
    constructor(client, delegate, credentialTypes, context, signal) {
        super();
        this.client = client;
        this.delegate = delegate;
        this.credentialTypes = credentialTypes;
        this.context = context;
        this.signal = signal;
    }
    async getDecrypted(_additionalData, nodeCredentials, type, _mode, executeData, raw, expressionResolveValues) {
        if (nodeCredentials.__aiGatewayManaged) {
            throw new engine_1.UnimplementedError(`Gateway credits are not supported on Engine v2 yet (credential type "${type}")`);
        }
        if (!nodeCredentials.id) {
            throw new n8n_workflow_1.UnexpectedError('Found credential with no ID.', {
                extra: { credentialName: nodeCredentials.name },
                tags: { credentialType: type },
            });
        }
        const consumerNode = expressionResolveValues?.node ?? executeData?.node;
        if (!consumerNode && raw === true) {
            throw this.oauthRefreshUnsupported(type);
        }
        if (!consumerNode) {
            throw new n8n_workflow_1.UnexpectedError('Engine v2 cannot resolve a credential without the node that uses it', {
                tags: { credentialType: type },
            });
        }
        const request = {
            credential: { id: nodeCredentials.id, name: nodeCredentials.name, type },
            execution: {
                executionId: this.context.executionId,
                workflowId: this.context.workflowId,
                mode: this.context.mode,
            },
            context: { userId: this.context.userId, projectId: this.context.projectId },
            consumer: { nodeType: consumerNode.type },
        };
        return await this.client.resolve(request, this.signal);
    }
    async preAuthentication(helpers, credentials, typeName, node, credentialsExpired) {
        if (this.hasExpirableProperty(typeName)) {
            throw new engine_1.UnimplementedError(`Engine v2 does not support credentials with an expirable property yet (credential type "${typeName}")`);
        }
        return await this.delegate.preAuthentication(helpers, credentials, typeName, node, credentialsExpired);
    }
    hasExpirableProperty(typeName) {
        return this.credentialTypes
            .getByName(typeName)
            .properties.some((property) => property.type === 'hidden' && property.typeOptions?.expirable === true);
    }
    async updateCredentialsOauthTokenData(_nodeCredentials, type, _data, _additionalData) {
        throw this.oauthRefreshUnsupported(type);
    }
    oauthRefreshUnsupported(type) {
        return new engine_1.UnimplementedError(`Engine v2 does not support OAuth token refresh yet (credential type "${type}")`);
    }
    async getCredentials(_nodeCredentials, type) {
        throw new n8n_workflow_1.UnexpectedError('Engine v2 cannot read the credential store', {
            tags: { credentialType: type },
        });
    }
    async updateCredentials(_nodeCredentials, type, _data) {
        throw new n8n_workflow_1.UnexpectedError('Engine v2 cannot write to the credential store', {
            tags: { credentialType: type },
        });
    }
    async authenticate(credentials, typeName, requestOptions, workflow, node) {
        return await this.delegate.authenticate(credentials, typeName, requestOptions, workflow, node);
    }
    async runPreAuthentication(helpers, credentials, typeName) {
        return await this.delegate.runPreAuthentication(helpers, credentials, typeName);
    }
    getParentTypes(name) {
        return this.delegate.getParentTypes(name);
    }
    isCredentialUsableByNode(credentialType, nodeType) {
        return this.delegate.isCredentialUsableByNode(credentialType, nodeType);
    }
    getCredentialsProperties(type) {
        return this.delegate.getCredentialsProperties(type);
    }
}
exports.RemoteCredentialsHelper = RemoteCredentialsHelper;
//# sourceMappingURL=remote-credentials-helper.js.map