import type { BuiltTool } from '@n8n/agents';
import type { ChannelSetupDeps, CredentialSetupDeps } from './setup-tool.types';
export interface FinishSetupConfigWrites {
    credentials: Array<{
        credentialType: string;
        id: string;
        name: string;
    }>;
    values: Array<{
        path: string;
        value: string;
    }>;
}
export interface FinishSetupConfigApplyResult {
    credentialTypes: string[];
    paths: string[];
    configHash?: string;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}
export interface FinishSetupToolDeps extends CredentialSetupDeps, ChannelSetupDeps {
    listAiGatewayManagedCredentialTypes?: () => Promise<string[]>;
    applySetupToConfig?: (writes: FinishSetupConfigWrites) => Promise<FinishSetupConfigApplyResult>;
}
export declare function buildFinishSetupTool(deps: FinishSetupToolDeps): BuiltTool;
