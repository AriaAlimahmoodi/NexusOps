import type { AuthenticatedRequest } from '@n8n/db';
import type { IDataObject, INodeProperties } from 'n8n-workflow';
export interface SecretsProviderSettings<T = IDataObject> {
    connected: boolean;
    connectedAt: Date | null;
    settings: T;
}
export interface ExternalSecretsSettings {
    [key: string]: SecretsProviderSettings;
}
export type SecretsProviderState = 'initializing' | 'initialized' | 'connecting' | 'connected' | 'error' | 'retrying';
interface StateTransition {
    from: SecretsProviderState;
    to: SecretsProviderState;
    at: Date;
    error?: Error;
}
export declare abstract class SecretsProvider {
    abstract displayName: string;
    abstract name: string;
    abstract properties: INodeProperties[];
    abstract init(settings: SecretsProviderSettings): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract update(): Promise<void>;
    abstract test(): Promise<[boolean] | [boolean, string]>;
    abstract getSecret(name: string): unknown;
    abstract hasSecret(name: string): boolean;
    abstract getSecretNames(): string[];
    state: SecretsProviderState;
    lastError?: Error;
    protected stateHistory: StateTransition[];
    connect(): Promise<void>;
    protected abstract doConnect(): Promise<void>;
    setState(newState: SecretsProviderState, error?: Error): void;
    get hasEverBeenConnected(): boolean;
    get canPerformOperations(): boolean;
}
export declare namespace ExternalSecretsRequest {
    type GetProviderResponse = Pick<SecretsProvider, 'displayName' | 'name' | 'properties'> & {
        icon: string;
        connected: boolean;
        connectedAt: Date | null;
        state: SecretsProviderState;
        data: IDataObject;
    };
    type GetProviders = AuthenticatedRequest;
    type GetProvider = AuthenticatedRequest<{
        provider: string;
    }, GetProviderResponse>;
    type SetProviderSettings = AuthenticatedRequest<{
        provider: string;
    }, {}, IDataObject>;
    type TestProviderSettings = SetProviderSettings;
    type SetProviderConnected = AuthenticatedRequest<{
        provider: string;
    }, {}, {
        connected: boolean;
    }>;
    type UpdateProvider = AuthenticatedRequest<{
        provider: string;
    }>;
}
export {};
