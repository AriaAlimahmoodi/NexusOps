import type { CredentialProvider, ModelConfig, ResolvedCredential } from '@n8n/agents';
export interface AiGatewayModelCredentialResolver {
    resolveAiGatewayModelCredential(provider: string): Promise<ResolvedCredential>;
}
export declare function resolveCredentialAwareModelConfig(model: string, credential: string, credentialProvider: CredentialProvider & Partial<AiGatewayModelCredentialResolver>, deploymentName?: string): Promise<ModelConfig>;
