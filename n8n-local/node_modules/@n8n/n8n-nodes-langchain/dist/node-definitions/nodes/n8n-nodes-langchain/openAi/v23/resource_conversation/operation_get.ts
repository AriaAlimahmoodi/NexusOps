/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=conversation, operation=get
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Get a conversation */
export type LcOpenAiV23ConversationGetParams = {
  resource: 'conversation';
  operation: 'get';
/**
 * The ID of the conversation to retrieve
 */
    conversationId: string | Expression<string>;
};

export interface LcOpenAiV23ConversationGetSubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23ConversationGetNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23ConversationGetParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23ConversationGetSubnodeConfig };
};