/**
 * Oracle Database Vector Store Node - Version 1.3
 * Discriminator: mode=retrieve-as-tool
 */


interface Credentials {
  oracleDBApi: CredentialReference;
}

/** Retrieve documents from vector store to be used as tool with AI nodes */
export type LcVectorStoreOracleDBVectorV13RetrieveAsToolParams = {
  /**
   * Canonical RAG mode — declare with the `tool({...})` factory (NOT `vectorStore`) and plug into an AI Agent's `subnodes.tools`. Required subnodes: `embedding`. Set `toolDescription` so the agent knows when to call it.
   * <patterns>
   * <pattern title="retrieve-as-tool mode — RAG via AI Agent (generic, works for any vectorStore* node)">
   * // Substitute the type literal and provider-specific parameters — see the rest of this file
   * // for the exact shape (e.g. pineconeIndex, qdrantCollection, supabaseTableName).
   * const knowledgeBase = tool({
   *   type: '@n8n/n8n-nodes-langchain.vectorStoreXxx',
   *   config: {
   *     name: 'Knowledge Base',
   *     parameters: {
   *       mode: 'retrieve-as-tool',
   *       toolDescription: 'Search the product knowledge base',
   *       // ...provider-specific parameters
   *     },
   *     subnodes: { embedding: embeddingsOpenAi }
   *   }
   * });
   * 
   * const agent = node({
   *   type: '@n8n/n8n-nodes-langchain.agent',
   *   config: {
   *     name: 'Support Agent',
   *     parameters: { promptType: 'define', text: expr('{{ $json.question }}') },
   *     subnodes: { model: openAiModel, tools: [knowledgeBase] }
   *   }
   * });
   * </pattern>
   * </patterns>
   */
  mode: 'retrieve-as-tool';
/**
 * Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often
 */
    toolDescription: string | Expression<string>;
/**
 * The table name to store the vectors in. If table does not exist, it will be created.
 * @default n8n_vectors
 */
    tableName?: string | Expression<string>;
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

export interface LcVectorStoreOracleDBVectorV13RetrieveAsToolSubnodeConfig {
  embedding: EmbeddingInstance | EmbeddingInstance[];
  /**
   * @displayOptions.show { useReranker: [true] }
   */
  reranker: RerankerInstance;
}

export type LcVectorStoreOracleDBVectorV13RetrieveAsToolNode = {
  type: '@n8n/n8n-nodes-langchain.vectorStoreOracleDBVector';
  version: 1.3;
  config: NodeConfig<LcVectorStoreOracleDBVectorV13RetrieveAsToolParams> & { credentials?: Credentials } & { subnodes: LcVectorStoreOracleDBVectorV13RetrieveAsToolSubnodeConfig };
};