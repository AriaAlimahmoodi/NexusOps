/**
 * MongoDB Chat Memory Node - Version 1.1
 * Stores the chat history in MongoDB collection.
 */


export interface LcMemoryMongoDbChatV11Params {
/**
 * Session ID
 * @builderHint Use 'Connected Chat Trigger Node' (fromInput) if there is a Chat Trigger node earlier in the workflow. Otherwise use 'Define below' (customKey).
 * @default fromInput
 */
    sessionIdType?: 'fromInput' | 'customKey' | Expression<string>;
/**
 * The key to use to store session ID in the memory
 * @displayOptions.show { sessionIdType: ["customKey"] }
 */
    sessionKey?: string | Expression<string>;
/**
 * The collection name to store the chat history in. If collection does not exist, it will be created.
 * @default n8n_chat_histories
 */
    collectionName?: string | Expression<string>;
/**
 * The database name to store the chat history in. If not provided, the database from credentials will be used.
 */
    databaseName?: string | Expression<string>;
/**
 * Context Window Length
 * @hint How many past interactions the model receives as context
 * @default 5
 */
    contextWindowLength?: number | Expression<number>;
}

export interface LcMemoryMongoDbChatV11Credentials {
  mongoDb: CredentialReference;
}

interface LcMemoryMongoDbChatV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.memoryMongoDbChat';
  version: 1.1;
}

export type LcMemoryMongoDbChatV11ParamsNode = LcMemoryMongoDbChatV11NodeBase & {
  config: NodeConfig<LcMemoryMongoDbChatV11Params> & { credentials?: LcMemoryMongoDbChatV11Credentials };
};

export type LcMemoryMongoDbChatV11Node = LcMemoryMongoDbChatV11ParamsNode;