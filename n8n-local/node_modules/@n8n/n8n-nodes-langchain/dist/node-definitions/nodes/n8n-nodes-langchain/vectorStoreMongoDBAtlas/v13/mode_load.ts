/**
 * MongoDB Atlas Vector Store Node - Version 1.3
 * Discriminator: mode=load
 */


interface Credentials {
  mongoDb: CredentialReference;
}

/** Get many ranked documents from vector store for query */
export type LcVectorStoreMongoDBAtlasV13LoadParams = {
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
  mongoCollection?: { __rl: true; mode: 'list' | 'name'; value: string; cachedResultName?: string };
/**
 * The field with the embedding array
 * @default embedding
 */
    embedding?: string | Expression<string>;
/**
 * The text field of the raw data
 * @default text
 */
    metadata_field?: string | Expression<string>;
/**
 * The name of the vector index
 */
    vectorIndexName: string | Expression<string>;
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
    /** Logical partition for documents. Uses metadata.namespace field for filtering.
     */
    namespace?: string | Expression<string>;
    /** Metadata to filter the document by
     * @default {}
     */
    metadata?: {
        /** Fields to Set
     */
    metadataValues?: Array<{
      /** Name
       */
      name?: string | Expression<string>;
      /** Value
       */
      value?: string | Expression<string>;
    }>;
  };
    /** MongoDB Atlas Vector Search pre-filter
     * @hint This is a filter applied in the $vectorSearch stage &lt;a href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#atlas-vector-search-pre-filter"&gt;here&lt;/a&gt;
     */
    preFilter?: IDataObject | string | Expression<string>;
    /** MongoDB aggregation pipeline in JSON format
     * @hint Learn more about aggregation pipeline &lt;a href="https://docs.mongodb.com/manual/core/aggregation-pipeline/"&gt;here&lt;/a&gt;
     */
    postFilterPipeline?: IDataObject | string | Expression<string>;
  };
};

export interface LcVectorStoreMongoDBAtlasV13LoadSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  /**
   * @displayOptions.show { useReranker: [true] }
   */
  reranker: RerankerInstance;
}

export type LcVectorStoreMongoDBAtlasV13LoadNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreMongoDBAtlas';
  version: 1.3;
  config: NodeConfig<LcVectorStoreMongoDBAtlasV13LoadParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreMongoDBAtlasV13LoadSubnodeConfig };
};