/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=text, operation=classify
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Check whether content complies with usage policies */
export type LcOpenAiV23TextClassifyParams = {
  resource: 'text';
  operation: 'classify';
/**
 * The input text to classify if it is violates the moderation policy
 */
    input?: string | Expression<string>;
/**
 * Whether to return a simplified version of the response instead of the raw data
 * @default false
 */
    simplify?: boolean | Expression<boolean>;
};

export interface LcOpenAiV23TextClassifySubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23TextClassifyNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23TextClassifyParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23TextClassifySubnodeConfig };
};