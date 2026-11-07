/**
 * Azure AI Search Vector Store Node - Version 1.3
 * Discriminator: mode=insert
 */


interface Credentials {
  azureAiSearchApi: CredentialReference;
}

/** Insert documents into vector store */
export type LcVectorStoreAzureAISearchV13InsertParams = {
  /**
   * Sits on the main flow — pipe the documents you want to embed into this node. Declare with `vectorStore({...})`. Required subnodes: `embedding` and `documentLoader`. If the goal is letting an LLM query the store, use `mode: 'retrieve-as-tool'` instead.
   * <patterns>
   * <pattern title="insert mode — upsert documents (generic, works for any vectorStore* node)">
   * // Substitute the type literal and provider-specific parameters (e.g. pineconeIndex,
   * // qdrantCollection, supabaseTableName) — see the rest of this file for the exact shape.
   * const store = vectorStore({
   *   type: '@n8n/n8n-nodes-langchain.vectorStoreXxx',
   *   config: {
   *     name: 'Knowledge Base',
   *     parameters: {
   *       mode: 'insert',
   *       // ...provider-specific parameters
   *     },
   *     subnodes: { embedding: embeddingsOpenAi, documentLoader: defaultDataLoader }
   *   }
   * });
   * </pattern>
   * </patterns>
   */
  mode: 'insert';
/**
 * The name of the Azure AI Search index. Will be created automatically if it does not exist.
 * @default n8n-vectorstore
 */
    indexName?: string | Expression<string>;
/**
 * Number of documents to embed in a single batch
 * @default 200
 */
    embeddingBatchSize?: number | Expression<number>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Whether to delete and recreate the index before inserting new data. Warning: This will reset any custom index configuration (semantic ranking, analyzers, etc.) to defaults.
     * @default false
     */
    clearIndex?: boolean | Expression<boolean>;
    /** Comma-separated list of metadata keys to store in Azure AI Search. Leave empty to include all metadata. Azure AI Search stores metadata in an "attributes" array format.
     */
    metadataKeysToInsert?: string | Expression<string>;
  };
};

export interface LcVectorStoreAzureAISearchV13InsertSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  documentLoader: DocumentLoaderInstance | DocumentLoaderInstance[];
}

export type LcVectorStoreAzureAISearchV13InsertNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreAzureAISearch';
  version: 1.3;
  config: NodeConfig<LcVectorStoreAzureAISearchV13InsertParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreAzureAISearchV13InsertSubnodeConfig };
};