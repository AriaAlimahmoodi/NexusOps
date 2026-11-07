/**
 * Azure AI Search Vector Store Node - Version 1.3
 * Discriminator: mode=load
 */


interface Credentials {
  azureAiSearchApi: CredentialReference;
}

/** Get many ranked documents from vector store for query */
export type LcVectorStoreAzureAISearchV13LoadParams = {
  /**
   * One-shot similarity search on the main flow using the `prompt` parameter. Declare with `vectorStore({...})`. Required subnodes: `embedding`. For LLM-driven querying (RAG), use `mode: 'retrieve-as-tool'` instead.
   * <patterns>
   * <pattern title="load mode — one-shot similarity search (generic)">
   * // Substitute the type literal and provider-specific parameters — see the rest of this file.
   * const lookup = vectorStore({
   *   type: '@n8n/n8n-nodes-langchain.vectorStoreXxx',
   *   config: {
   *     name: 'Knowledge Base',
   *     parameters: {
   *       mode: 'load',
   *       prompt: expr('{{ $json.query }}'),
   *       // ...provider-specific parameters
   *     },
   *     subnodes: { embedding: embeddingsOpenAi }
   *   }
   * });
   * </pattern>
   * </patterns>
   */
  mode: 'load';
/**
 * The name of the Azure AI Search index. Will be created automatically if it does not exist.
 * @default n8n-vectorstore
 */
    indexName?: string | Expression<string>;
/**
 * Search prompt to retrieve matching documents from the vector store using similarity-based ranking
 */
    prompt: string | Expression<string>;
/**
 * Number of top results to fetch from vector store
 * @default 4
 */
    topK?: number | Expression<number>;
/**
 * Whether or not to include document metadata
 * @default true
 */
    includeDocumentMetadata?: boolean | Expression<boolean>;
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

export interface LcVectorStoreAzureAISearchV13LoadSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  /**
   * @displayOptions.show { useReranker: [true] }
   */
  reranker: RerankerInstance;
}

export type LcVectorStoreAzureAISearchV13LoadNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreAzureAISearch';
  version: 1.3;
  config: NodeConfig<LcVectorStoreAzureAISearchV13LoadParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreAzureAISearchV13LoadSubnodeConfig };
};