import type { CredentialProvider } from '@n8n/agents';
import type { AiGatewayModelCredentialResolver } from '../../../modules/agents/json-config/model-config';
export type AgentCredentialProvider = CredentialProvider & Partial<AiGatewayModelCredentialResolver>;
export declare function scopeCredentialProvider(provider: AgentCredentialProvider, getAllowedCredentialIds: () => string[] | undefined): AgentCredentialProvider;
