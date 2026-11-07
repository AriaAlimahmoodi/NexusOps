/**
 * Embeddings Oracle Database Node - Version 1
 * Use ONNX Embeddings
 */


export interface LcEmbeddingsOracleDbV1Params {
/**
 * The model. Choose from the list, or specify an ID.
 * @searchListMethod searchModels
 * @default {"mode":"list","value":"ALL_MINILM_L12_V2"}
 */
    model?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
}

export interface LcEmbeddingsOracleDbV1Credentials {
  oracleDBApi: CredentialReference;
}

interface LcEmbeddingsOracleDbV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsOracleDb';
  version: 1;
}

export type LcEmbeddingsOracleDbV1ParamsNode = LcEmbeddingsOracleDbV1NodeBase & {
  config: NodeConfig<LcEmbeddingsOracleDbV1Params> & { credentials?: LcEmbeddingsOracleDbV1Credentials };
};

export type LcEmbeddingsOracleDbV1Node = LcEmbeddingsOracleDbV1ParamsNode;