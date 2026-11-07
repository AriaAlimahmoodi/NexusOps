/**
 * OpenAI Node - Version 2.3
 * Discriminator: resource=conversation, operation=remove
 */


interface Credentials {
  openAiApi: CredentialReference;
}

/** Remove a conversation */
export type LcOpenAiV23ConversationRemoveParams = {
  resource: 'conversation';
  operation: 'remove';
/**
 * The ID of the conversation to delete
 */
    conversationId: string | Expression<string>;
};

export interface LcOpenAiV23ConversationRemoveSubnodeConfig {
  tools?: ToolInstance[];
  memory?: MemoryInstance;
}

export type LcOpenAiV23ConversationRemoveNode = {
  type: '@n8n/n8n-nodes-langchain.openAi';
  version: 2.3;
  isTrigger: true;
  config: NodeConfig<LcOpenAiV23ConversationRemoveParams> & { credentials?: Credentials } & { subnodes?: LcOpenAiV23ConversationRemoveSubnodeConfig };
};