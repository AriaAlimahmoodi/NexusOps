import { Logger } from '@n8n/backend-common';
import { type IDataObject, type INodeProperties } from 'n8n-workflow';
import { SecretsProvider, type SecretsProviderSettings } from '../types';
export type OnePasswordContext = SecretsProviderSettings<{
    serverUrl: string;
    accessToken: string;
}>;
export declare class OnePasswordProvider extends SecretsProvider {
    private readonly logger;
    name: string;
    displayName: string;
    properties: INodeProperties[];
    private cachedSecrets;
    private client;
    private settings;
    constructor(logger?: Logger);
    init(context: OnePasswordContext): Promise<void>;
    protected doConnect(): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    disconnect(): Promise<void>;
    update(): Promise<void>;
    getSecret(name: string): IDataObject;
    hasSecret(name: string): boolean;
    getSecretNames(): string[];
    private verifyConnection;
    private logOperationFailure;
}
