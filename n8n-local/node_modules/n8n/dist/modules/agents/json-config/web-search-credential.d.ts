import type { CredentialProvider, ResolvedCredential } from '@n8n/agents';
export declare const WEB_SEARCH_GATEWAY_CREDENTIAL_TYPES: Record<string, string>;
export interface AiGatewaySearchCredentialResolver {
    resolveAiGatewaySearchCredential(credentialType: string): Promise<ResolvedCredential>;
}
export interface WebSearchGatewayProxyConfig {
    apiUrl: string;
    getAuthHeaders: () => Promise<Record<string, string>>;
}
export declare function resolveWebSearchGatewayProxyConfig(provider: string, credentialProvider: CredentialProvider & Partial<AiGatewaySearchCredentialResolver>): Promise<WebSearchGatewayProxyConfig>;
