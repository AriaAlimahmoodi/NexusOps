import { Logger } from '@n8n/backend-common';
import { type INodeProperties } from 'n8n-workflow';
import type { GcpSecretsManagerContext } from './types';
import { SecretsProvider } from '../../types';
export declare class GcpSecretsManager extends SecretsProvider {
    private readonly logger;
    name: string;
    displayName: string;
    properties: INodeProperties[];
    private cachedSecrets;
    private client;
    private settings;
    constructor(logger?: Logger);
    init(context: GcpSecretsManagerContext): Promise<void>;
    protected doConnect(): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    disconnect(): Promise<void>;
    update(): Promise<void>;
    getSecret(name: string): string;
    hasSecret(name: string): boolean;
    getSecretNames(): string[];
    private parseSecretAccountKey;
    private getGcpErrorCode;
    private logOperationFailure;
}
