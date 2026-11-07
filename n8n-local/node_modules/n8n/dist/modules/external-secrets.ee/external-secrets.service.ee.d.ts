import type { IDataObject } from 'n8n-workflow';
import { ExternalSecretsManager } from './external-secrets-manager.ee';
import { RedactionService } from './redaction.service.ee';
import type { ExternalSecretsRequest, SecretsProvider } from './types';
export declare class ExternalSecretsService {
    private readonly externalSecretsManager;
    private readonly redactionService;
    constructor(externalSecretsManager: ExternalSecretsManager, redactionService: RedactionService);
    getProvider(providerName: string): ExternalSecretsRequest.GetProviderResponse | null;
    getProviders(): {
        displayName: string;
        name: string;
        icon: string;
        state: import("./types").SecretsProviderState;
        connected: boolean;
        connectedAt: Date | null;
        data: IDataObject;
    }[];
    redact(data: IDataObject, provider: SecretsProvider): IDataObject;
    unredact(redactedData: IDataObject, savedData: IDataObject): IDataObject;
    saveProviderSettings(providerName: string, data: IDataObject, userId: string): Promise<void>;
    saveProviderConnected(providerName: string, connected: boolean): Promise<ExternalSecretsRequest.GetProviderResponse | null>;
    getAllSecrets(): Record<string, string[]>;
    testProviderSettings(providerName: string, data: IDataObject): Promise<{
        readonly success: false;
        readonly testState: 'error';
    } | {
        success: boolean;
        testState: string;
        error: string | undefined;
    } | {
        error?: undefined;
        success: boolean;
        testState: "connected" | "tested";
    }>;
    updateProvider(providerName: string): Promise<void>;
}
