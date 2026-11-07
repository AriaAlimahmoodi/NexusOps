/**
 * Azure AI Search Vector Store Node - Version 1.3
 * Discriminator: mode=retrieve
 */


interface Credentials {
  azureAiSearchApi: CredentialReference;
}

/** Retrieve documents from vector store to be used as vector store with AI nodes */
export type LcVectorStoreAzureAISearchV13RetrieveParams = {
  /**
   * Exposes the store as an `ai_vectorStore` subnode for another node (e.g. `toolVectorStore`). Declare with `vectorStore({...})`. Required subnodes: `embedding`. For RAG with an AI Agent directly, prefer `mode: 'retrieve-as-tool'`.
   * <patterns>
   * <pattern title="retrieve mode — feed another node as a subnode (generic)">
   * // Substitute the type literal and provider-specific parameters — see the rest of this file.
   * const store = vectorStore({
   *   type: '@n8n/n8n-nodes-langchain.vectorStoreXxx',
   *   config: {
   *     name: 'Knowledge Base',
   *     parameters: { mode: 'retrieve' /* + provider-specific parameters *\/ },
   *     subnodes: { embedding: embeddingsOpenAi }
   *   }
   * });
   * 
   * const retrieverTool = tool({
   *   type: '@n8n/n8n-nodes-langchain.toolVectorStore',
   *   config: {
   *     name: 'KB Retriever',
   *     parameters: { description: 'Search the product knowledge base' },
   *     subnodes: { vectorStore: store, model: openAiModel }
   *   }
   * });
   * </pattern>
   * </patterns>
   */
  mode: 'retrieve';
/**
 * The name of the Azure AI Search index. Will be created automatically if it does not exist.
 * @default n8n-vectorstore
 */
    indexName?: string | Expression<string>;
/**
 * Whether or not to rerank results
 * @default false
 */
    useReranker?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** The type of search query to perform
     * @default hybrid
     */
    queryType?: 'vector' | 'hybrid' | 'semanticHybrid' | Expression<string>;
    /** Filter results using OData syntax. Use metadata/fieldName for metadata fields. &lt;a href="https://learn.microsoft.com/en-us/azure/search/search-query-odata-filter" target="_blank"&gt;Learn more&lt;/a&gt;.
     */
    filter?: string | Expression<string>;
    /** Name of the semantic configuration for semantic ranking (optional)
     * @displayOptions.show { queryType: ["semanticHybrid"] }
     */
    semanticConfiguration?: string | Expression<string>;
  };
};

export interface LcVectorStoreAzureAISearchV13RetrieveSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  /**
   * @displayOptions.show { useReranker: [true] }
   */
  reranker: RerankerInstance;
}

export type LcVectorStoreAzureAISearchV13RetrieveNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreAzureAISearch';
  version: 1.3;
  config: NodeConfig<LcVectorStoreAzureAISearchV13RetrieveParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreAzureAISearchV13RetrieveSubnodeConfig };
};