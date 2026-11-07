"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcpSecretsManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../constants");
const secrets_provider_errors_1 = require("../../errors/secrets-provider-errors");
const types_1 = require("../../types");
class GcpSecretsManager extends types_1.SecretsProvider {
    constructor(logger = di_1.Container.get(backend_common_1.Logger)) {
        super();
        this.logger = logger;
        this.name = 'gcpSecretsManager';
        this.displayName = 'GCP Secrets Manager';
        this.properties = [
            constants_1.DOCS_HELP_NOTICE,
            {
                displayName: 'Service Account Key',
                name: 'serviceAccountKey',
                type: 'json',
                default: '',
                required: true,
                typeOptions: { password: true },
                placeholder: 'e.g. { "type": "service_account", "project_id": "gcp-secrets-store", ... }',
                hint: 'Content of JSON file downloaded from Google Cloud Console.',
                noDataExpression: true,
            },
        ];
        this.cachedSecrets = {};
        this.logger = this.logger.scoped('external-secrets');
    }
    async init(context) {
        try {
            this.settings = this.parseSecretAccountKey(context.settings.serviceAccountKey);
        }
        catch (error) {
            this.logOperationFailure('Failed to initialize GCP Secrets Manager provider', {
                operation: 'initialize',
                error,
            });
            throw error;
        }
    }
    async doConnect() {
        try {
            const { projectId, privateKey, clientEmail } = this.settings;
            const { SecretManagerServiceClient: GcpClient } = await import('@google-cloud/secret-manager');
            this.client = new GcpClient({
                credentials: { client_email: clientEmail, private_key: privateKey },
                projectId,
            });
            this.logger.debug('GCP Secrets Manager provider connected');
        }
        catch (error) {
            this.logOperationFailure('Failed to connect GCP Secrets Manager provider', {
                operation: 'connect',
                error,
            });
            throw error;
        }
    }
    async test() {
        if (!this.client)
            return [false, 'Failed to connect to GCP Secrets Manager'];
        try {
            await this.client.initialize();
            return [true];
        }
        catch (error) {
            this.logOperationFailure('GCP Secrets Manager provider test failed', {
                operation: 'test',
                error,
            });
            return [false, error instanceof Error ? error.message : 'Unknown error'];
        }
    }
    async disconnect() {
    }
    async update() {
        try {
            const { projectId } = this.settings;
            const [rawSecretNames] = await this.client.listSecrets({
                parent: `projects/${projectId}`,
            });
            const secretNames = rawSecretNames.reduce((acc, cur) => {
                if (!cur.name)
                    return acc;
                const secretName = cur.name.split('/').pop();
                if (secretName)
                    acc.push(secretName);
                return acc;
            }, []);
            const skippedSecrets = [];
            let firstSkippedError;
            const promises = secretNames.map(async (name) => {
                let versions;
                try {
                    versions = await this.client.accessSecretVersion({
                        name: `projects/${projectId}/secrets/${name}/versions/latest`,
                    });
                }
                catch (error) {
                    const errorCode = this.getGcpErrorCode(error);
                    if (errorCode === 7 || errorCode === 5 || errorCode === 14) {
                        if (firstSkippedError === undefined) {
                            firstSkippedError = error;
                        }
                        this.logger.debug('Skipping inaccessible GCP secret version', {
                            providerName: this.name,
                            operation: 'update',
                            projectId,
                            secretName: name,
                            errorCode,
                        });
                        skippedSecrets.push({
                            name,
                            errorCode: errorCode ?? 'unknown',
                        });
                    }
                    else {
                        throw error;
                    }
                }
                if (!Array.isArray(versions) || !versions.length)
                    return null;
                const [latestVersion] = versions;
                if (!latestVersion.payload?.data)
                    return null;
                const value = latestVersion.payload.data.toString();
                if (!value)
                    return null;
                return { name, value };
            });
            const results = await Promise.all(promises);
            this.cachedSecrets = results.reduce((acc, cur) => {
                if (cur)
                    acc[cur.name] = cur.value;
                return acc;
            }, {});
            const failureSummary = (0, secrets_provider_errors_1.buildFailureSummaryLogContext)(skippedSecrets);
            if (failureSummary) {
                this.logOperationFailure('Skipped inaccessible GCP secret versions during update', {
                    operation: 'update',
                    error: firstSkippedError instanceof Error
                        ? firstSkippedError
                        : new Error('One or more GCP secret versions were inaccessible'),
                    context: failureSummary,
                });
            }
            this.logger.debug('GCP Secrets Manager provider secrets updated');
        }
        catch (error) {
            this.logOperationFailure('Failed to update GCP Secrets Manager provider secrets', {
                operation: 'update',
                error,
            });
            throw error;
        }
    }
    getSecret(name) {
        return this.cachedSecrets[name];
    }
    hasSecret(name) {
        return name in this.cachedSecrets;
    }
    getSecretNames() {
        return Object.keys(this.cachedSecrets);
    }
    parseSecretAccountKey(serviceAccountKey) {
        const secretAccountKey = (0, n8n_workflow_1.jsonParse)(serviceAccountKey, {
            fallbackValue: {},
        });
        const clientEmail = secretAccountKey.client_email?.trim();
        const privateKey = secretAccountKey.private_key?.trim();
        const projectId = secretAccountKey.project_id?.trim();
        if (!clientEmail || !privateKey) {
            this.logger.warn('Service account key must contain "client_email" and "private_key" fields. Use the downloaded service account JSON key file from Google Cloud Console.');
            throw new n8n_workflow_1.UserError('Service account key must contain "client_email" and "private_key" fields. Use the downloaded service account JSON key file from Google Cloud Console.');
        }
        return {
            projectId: projectId ?? '',
            clientEmail,
            privateKey,
        };
    }
    getGcpErrorCode(error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const { code } = error;
            if (typeof code === 'number' || typeof code === 'string') {
                return code;
            }
        }
        return undefined;
    }
    logOperationFailure(message, params) {
        const context = { ...params.context };
        const errorCode = this.getGcpErrorCode(params.error);
        if (errorCode !== undefined) {
            context.errorCode = errorCode;
        }
        if (this.settings?.projectId) {
            context.projectId = this.settings.projectId;
        }
        (0, secrets_provider_errors_1.logSecretsProviderOperationFailure)({
            logger: this.logger,
            message,
            providerName: this.name,
            providerDisplayName: this.displayName,
            operation: params.operation,
            error: params.error,
            context,
        });
    }
}
exports.GcpSecretsManager = GcpSecretsManager;
//# sourceMappingURL=gcp-secrets-manager.js.map