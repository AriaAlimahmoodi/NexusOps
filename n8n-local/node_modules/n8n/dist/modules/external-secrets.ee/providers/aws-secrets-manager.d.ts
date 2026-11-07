import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { type INodeProperties } from 'n8n-workflow';
import { SecretsProvider, type SecretsProviderSettings } from '../types';
export type Secret = {
    secretName: string;
    secretValue: string;
};
export type AwsSecretsManagerSettings = {
    region: string;
    authMethod: 'iamUser' | 'autoDetect';
};
export type AwsSecretsManagerContext = SecretsProviderSettings<{
    region: string;
} & ({
    authMethod: 'iamUser';
    accessKeyId: string;
    secretAccessKey: string;
} | {
    authMethod: 'autoDetect';
})>;
export declare class AwsSecretsManager extends SecretsProvider {
    private readonly logger;
    private readonly outboundHttp;
    name: string;
    displayName: string;
    properties: INodeProperties[];
    private cachedSecrets;
    private client;
    private settings;
    constructor(logger?: Logger, outboundHttp?: OutboundHttp);
    init(context: AwsSecretsManagerContext): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    protected doConnect(): Promise<void>;
    disconnect(): Promise<void>;
    update(): Promise<void>;
    getSecret(name: string): string;
    hasSecret(name: string): boolean;
    getSecretNames(): string[];
    private assertAuthType;
    private fetchAllSecretsNames;
    private fetchAllSecrets;
    private batch;
    private verifyConnection;
    private isRecord;
    private getAwsErrorCode;
    private awsErrorContext;
    private logOperationFailure;
}
