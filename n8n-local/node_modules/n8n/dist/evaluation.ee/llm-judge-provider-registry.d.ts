import { type LlmJudgeProvider } from '@n8n/api-types';
export type { ProviderCredentialType } from '@n8n/api-types';
export type ProviderEntry = LlmJudgeProvider;
export declare class LlmJudgeProviderRegistry {
    listProviders(): ProviderEntry[];
    get(nodeType: string): ProviderEntry | undefined;
    getByCredentialType(credentialType: string): ProviderEntry | undefined;
}
