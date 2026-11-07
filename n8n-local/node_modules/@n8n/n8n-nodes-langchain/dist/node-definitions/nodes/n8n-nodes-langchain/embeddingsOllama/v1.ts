/**
 * Embeddings Ollama Node - Version 1
 * Use Ollama Embeddings
 */


export interface LcEmbeddingsOllamaV1Params {
/**
 * The model which will generate the completion. To download models, visit &lt;a href="https://ollama.ai/library"&gt;Ollama Models Library&lt;/a&gt;.
 * @default llama3.2
 */
    model?: string | Expression<string>;
}

export interface LcEmbeddingsOllamaV1Credentials {
  ollamaApi: CredentialReference;
}

interface LcEmbeddingsOllamaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.embeddingsOllama';
  version: 1;
}

export type LcEmbeddingsOllamaV1ParamsNode = LcEmbeddingsOllamaV1NodeBase & {
  config: NodeConfig<LcEmbeddingsOllamaV1Params> & { credentials?: LcEmbeddingsOllamaV1Credentials };
};

export type LcEmbeddingsOllamaV1Node = LcEmbeddingsOllamaV1ParamsNode;