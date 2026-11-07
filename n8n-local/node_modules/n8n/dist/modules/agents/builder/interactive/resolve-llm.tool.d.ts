import type { BuiltTool, CredentialProvider } from '@n8n/agents';
import type { ModelChoice } from '../model-lookup.types';
export interface ModelLookup {
    list(credentialId: string, credentialType: string, provider: string): Promise<ModelChoice[]>;
}
export interface FreeCreditsProvisioner {
    isEligible(): boolean | Promise<boolean>;
    claim(): Promise<{
        credentialId: string;
        credentialName: string;
    }>;
}
export interface ResolveLlmToolDeps {
    credentialProvider: CredentialProvider;
    modelLookup: ModelLookup;
    isProviderServedByGateway?(provider: string): Promise<boolean>;
    freeCredits: FreeCreditsProvisioner;
}
export declare function buildResolveLlmTool(deps: ResolveLlmToolDeps): BuiltTool;
