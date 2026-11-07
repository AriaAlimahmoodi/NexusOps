import type { CredentialProvider, EmbeddingProviderOptions } from '@n8n/agents';
export type ManagedEmbeddingProviderOptions = EmbeddingProviderOptions;
export type ManagedEmbeddingProviderOptionsResolver = () => Promise<ManagedEmbeddingProviderOptions | null>;
export declare function resolveEmbeddingProviderOptionsFromCredential(credential: string, embeddingModel: string, credentialProvider: CredentialProvider): Promise<ManagedEmbeddingProviderOptions>;
