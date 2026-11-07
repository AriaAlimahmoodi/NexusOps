import type { BuiltVectorStoreBackend, CredentialProvider, ResolvedCredential } from '@n8n/agents';
import { VectorStore } from '@n8n/agents';
import type { AgentJsonVectorStoreConfig } from '@n8n/api-types';
export declare function buildVectorStoreBackend(config: AgentJsonVectorStoreConfig, credentialProvider: CredentialProvider, resolvedCredential?: ResolvedCredential): Promise<BuiltVectorStoreBackend>;
export declare function buildVectorStore(config: AgentJsonVectorStoreConfig, credentialProvider: CredentialProvider): Promise<VectorStore>;
