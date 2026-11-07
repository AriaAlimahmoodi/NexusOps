/**
 * Embeddings Lemonade Node - Version 1
 * Use Lemonade Embeddings
 */


export interface LcEmbeddingsLemonadeV1Params {
/**
 * The model which will generate the completion. Models are loaded and managed through the Lemonade server.
 */
    model: string | Expression<string>;
}

export interface LcEmbeddingsLemonadeV1Credentials {
  lemonadeApi: CredentialReference;
}

interface LcEmbeddingsLemonadeV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsLemonade';
  version: 1;
}

export type LcEmbeddingsLemonadeV1ParamsNode = LcEmbeddingsLemonadeV1NodeBase & {
  config: NodeConfig<LcEmbeddingsLemonadeV1Params> & { credentials?: LcEmbeddingsLemonadeV1Credentials };
};

export type LcEmbeddingsLemonadeV1Node = LcEmbeddingsLemonadeV1ParamsNode;