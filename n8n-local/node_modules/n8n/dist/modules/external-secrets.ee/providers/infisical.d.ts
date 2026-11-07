import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { type INodeProperties } from 'n8n-workflow';
import type { SecretsProviderSettings } from '../types';
import { SecretsProvider } from '../types';
export type InfisicalAuthMethod = 'universalAuth';
export interface InfisicalSettings {
    siteURL: string;
    projectId: string;
    environment: string;
    secretPath: string;
    authMethod: InfisicalAuthMethod;
    clientId: string;
    clientSecret: string;
}
export interface InfisicalUniversalAuthLoginResponse {
    accessToken: string;
    expiresIn: number;
    accessTokenMaxTTL: number;
    tokenType: string;
}
export interface InfisicalSecret {
    secretKey: string;
    secretValue: string;
}
export interface InfisicalImport {
    secrets: InfisicalSecret[];
    secretPath: string;
    environment: string;
}
export interface InfisicalListSecretsResponse {
    secrets: InfisicalSecret[];
    imports: InfisicalImport[];
}
export declare class InfisicalProvider extends SecretsProvider {
    readonly logger: Logger;
    private readonly outboundHttp;
    properties: INodeProperties[];
    displayName: string;
    name: string;
    private cachedSecrets;
    private settings;
    private http;
    private currentToken;
    private tokenExpiresAt;
    private refreshTimeout;
    private refreshAbort;
    constructor(logger?: Logger, outboundHttp?: OutboundHttp);
    init(settings: SecretsProviderSettings): Promise<void>;
    protected doConnect(): Promise<void>;
    disconnect(): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    update(): Promise<void>;
    private fetchSecrets;
    private dedupeSecrets;
    private cacheSecrets;
    private ensureTokenFresh;
    private loginUniversalAuth;
    private setupTokenRefresh;
    private tokenRefresh;
    getSecret(name: string): string | undefined;
    getSecretNames(): string[];
    hasSecret(name: string): boolean;
    private buildAuthHeaders;
    private verifyWorkspaceAccess;
    private logOperationFailure;
}
