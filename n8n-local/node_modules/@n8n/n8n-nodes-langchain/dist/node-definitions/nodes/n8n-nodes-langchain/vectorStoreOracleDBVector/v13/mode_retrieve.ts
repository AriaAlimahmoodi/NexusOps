/**
 * Oracle Database Vector Store Node - Version 1.3
 * Discriminator: mode=retrieve
 */


interface Credentials {
  oracleDBApi: CredentialReference;
}

/** Retrieve documents from vector store to be used as vector store with AI nodes */
export type LcVectorStoreOracleDBVectorV13RetrieveParams = {
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
 * The table name to store the vectors in. If table does not exist, it will be created.
 * @default n8n_vectors
 */
    tableName?: string | Expression<string>;
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
    /** The method to calculate the distance between two vectors
     * @default COSINE
     */
    distanceStrategy?: 'COSINE' | 'DOT' | 'EUCLIDEAN' | 'MANHATTAN' | 'EUCLIDEAN_SQUARED' | 'HAMMING' | Expression<string>;
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
  };
};

export interface LcVectorStoreOracleDBVectorV13RetrieveSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  /**
   * @displayOptions.show { useReranker: [true] }
   */
  reranker: RerankerInstance;
}

export type LcVectorStoreOracleDBVectorV13RetrieveNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreOracleDBVector';
  version: 1.3;
  config: NodeConfig<LcVectorStoreOracleDBVectorV13RetrieveParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreOracleDBVectorV13RetrieveSubnodeConfig };
};