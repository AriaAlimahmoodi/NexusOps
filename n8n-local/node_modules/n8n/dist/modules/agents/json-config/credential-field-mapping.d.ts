import { type ResolvedCredential } from '@n8n/agents';
export declare function mapCredentialForProvider(provider: string, raw: ResolvedCredential): Record<string, unknown>;
export declare const SUPPORTED_AGENT_PROVIDERS: readonly string[];
export declare function isSupportedAgentProvider(provider: string): boolean;
