import type { InstanceAiSandboxProvider } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { OperationContext } from '@n8n/db';
import { InstanceCredentialBroker, type InstanceCredentialUse } from '../credentials/instance-credential-broker';
export declare const INSTANCE_AI_DAYTONA_CREDENTIAL_POLICY: InstanceCredentialUse;
export declare const INSTANCE_AI_N8N_SANDBOX_CREDENTIAL_POLICY: InstanceCredentialUse;
export declare class SandboxSettingsService {
    private readonly instanceCredentialBroker;
    private readonly logger;
    private readonly config;
    private readonly agentsConfig;
    private readonly deploymentConfig;
    private credentialUsesRegistered;
    constructor(globalConfig: GlobalConfig, instanceCredentialBroker: InstanceCredentialBroker, logger: Logger);
    isAgentSandboxEnabled(): boolean;
    getProvider(): InstanceAiSandboxProvider;
    registerCredentialUses(): void;
    resolveDaytonaConfig(): Promise<{
        apiUrl?: string;
        apiKey?: string;
    }>;
    resolveN8nSandboxConfig(ctx?: OperationContext): Promise<{
        serviceUrl?: string;
        apiKey?: string;
    }>;
    private resolveServiceCredential;
    private warnCredentialFallback;
}
