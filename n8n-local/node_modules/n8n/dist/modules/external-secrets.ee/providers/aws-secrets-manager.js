"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSecretsManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const constants_1 = require("../constants");
const secrets_provider_errors_1 = require("../errors/secrets-provider-errors");
const unknown_auth_type_error_1 = require("../errors/unknown-auth-type.error");
const types_1 = require("../types");
class AwsSecretsManager extends types_1.SecretsProvider {
    constructor(logger = di_1.Container.get(backend_common_1.Logger), outboundHttp = di_1.Container.get(backend_network_1.OutboundHttp)) {
        super();
        this.logger = logger;
        this.outboundHttp = outboundHttp;
        this.name = 'awsSecretsManager';
        this.displayName = 'AWS Secrets Manager';
        this.properties = [
            constants_1.DOCS_HELP_NOTICE,
            {
                displayName: 'Region',
                name: 'region',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. eu-west-3',
                noDataExpression: true,
            },
            {
                displayName: 'Authentication Method',
                name: 'authMethod',
                type: 'options',
                options: [
                    {
                        name: 'IAM User',
                        value: 'iamUser',
                        description: 'Credentials for IAM user having <code>secretsmanager:ListSecrets</code> and <code>secretsmanager:BatchGetSecretValue</code> permissions. <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html" target="_blank">Learn more</a>',
                    },
                    {
                        name: 'Auto Detect',
                        value: 'autoDetect',
                        description: 'Use automatic credential detection to authenticate AWS calls for external secrets<a href="https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html#credchain" target="_blank">Learn more</a>.',
                    },
                ],
                default: 'iamUser',
                required: true,
                noDataExpression: true,
            },
            {
                displayName: 'Access Key ID',
                name: 'accessKeyId',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. ACHXUQMBAQEVTE2RKMWP',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        authMethod: ['iamUser'],
                    },
                },
            },
            {
                displayName: 'Secret Access Key',
                name: 'secretAccessKey',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. cbmjrH/xNAjPwlQR3i/1HRSDD+esQX/Lan3gcmBc',
                typeOptions: { password: true },
                noDataExpression: true,
                displayOptions: {
                    show: {
                        authMethod: ['iamUser'],
                    },
                },
            },
        ];
        this.cachedSecrets = {};
        this.logger = this.logger.scoped('external-secrets');
    }
    async init(context) {
        const { region, authMethod } = context.settings;
        this.settings = { region, authMethod };
        try {
            this.assertAuthType(context);
            const clientConfig = { region };
            if (authMethod === 'iamUser') {
                const { accessKeyId, secretAccessKey } = context.settings;
                clientConfig.credentials = { accessKeyId, secretAccessKey };
            }
            clientConfig.requestHandler = this.outboundHttp
                .transport({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .getNodeAgent({ keepAlive: true, maxSockets: 50 });
            const { SecretsManager } = await import('@aws-sdk/client-secrets-manager');
            this.client = new SecretsManager(clientConfig);
            this.logger.debug('AWS Secrets Manager provider initialized');
        }
        catch (error) {
            this.logOperationFailure('Failed to initialize AWS Secrets Manager provider', {
                operation: 'initialize',
                error,
            });
            throw error;
        }
    }
    async test() {
        try {
            await this.verifyConnection();
            return [true];
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logOperationFailure('AWS Secrets Manager provider test failed', {
                operation: 'test',
                error,
                context: this.awsErrorContext(error),
            });
            return [false, error.message];
        }
    }
    async doConnect() {
        try {
            await this.verifyConnection();
            this.logger.debug('AWS Secrets Manager provider connected');
        }
        catch (error) {
            this.logOperationFailure('Failed to connect AWS Secrets Manager provider', {
                operation: 'connect',
                error,
                context: this.awsErrorContext(error),
            });
            throw error;
        }
    }
    async disconnect() {
        return;
    }
    async update() {
        try {
            const secrets = await this.fetchAllSecrets();
            const supportedSecrets = secrets;
            this.cachedSecrets = Object.fromEntries(supportedSecrets.map((s) => [s.secretName, s.secretValue]));
            this.logger.debug('AWS Secrets Manager provider secrets updated');
        }
        catch (error) {
            this.logOperationFailure('Failed to update AWS Secrets Manager provider secrets', {
                operation: 'update',
                error,
                context: this.awsErrorContext(error),
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
    assertAuthType(context) {
        const { authMethod } = context.settings;
        if (authMethod === 'iamUser' || authMethod === 'autoDetect')
            return;
        throw new unknown_auth_type_error_1.UnknownAuthTypeError(authMethod);
    }
    async fetchAllSecretsNames() {
        const names = [];
        let nextToken;
        do {
            const response = await this.client.listSecrets({
                NextToken: nextToken,
            });
            if (response.SecretList) {
                names.push(...response.SecretList.filter((s) => s.Name).map((s) => s.Name));
            }
            nextToken = response.NextToken;
        } while (nextToken);
        return names;
    }
    async fetchAllSecrets() {
        const secrets = [];
        const secretNames = await this.fetchAllSecretsNames();
        const batches = this.batch(secretNames);
        for (const batch of batches) {
            const response = await this.client.batchGetSecretValue({
                SecretIdList: batch,
            });
            if (response.SecretValues) {
                for (const secret of response.SecretValues) {
                    if (secret.Name && secret.SecretString) {
                        secrets.push({
                            secretName: secret.Name,
                            secretValue: secret.SecretString,
                        });
                    }
                }
            }
        }
        return secrets;
    }
    batch(arr, size = 20) {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, index) => arr.slice(index * size, (index + 1) * size));
    }
    async verifyConnection() {
        await this.client.listSecrets({ MaxResults: 1 });
    }
    isRecord(value) {
        return typeof value === 'object' && value !== null;
    }
    getAwsErrorCode(error) {
        if (this.isRecord(error)) {
            if ('Code' in error && typeof error.Code === 'string') {
                return error.Code;
            }
            if ('code' in error) {
                const { code } = error;
                if (typeof code === 'string' || typeof code === 'number') {
                    return code;
                }
            }
        }
        if (error instanceof Error) {
            return error.name;
        }
        if (this.isRecord(error) && typeof error.name === 'string') {
            return error.name;
        }
        return undefined;
    }
    awsErrorContext(error) {
        const context = {};
        const errorCode = this.getAwsErrorCode(error);
        if (errorCode !== undefined) {
            context.errorCode = errorCode;
        }
        if (this.isRecord(error) && '$metadata' in error) {
            const metadata = error.$metadata;
            if (this.isRecord(metadata) && typeof metadata.httpStatusCode === 'number') {
                context.statusCode = metadata.httpStatusCode;
            }
        }
        return context;
    }
    logOperationFailure(message, params) {
        const context = { ...params.context };
        if (this.settings?.region) {
            context.region = this.settings.region;
        }
        if (this.settings?.authMethod) {
            context.authMethod = this.settings.authMethod;
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
exports.AwsSecretsManager = AwsSecretsManager;
//# sourceMappingURL=aws-secrets-manager.js.map