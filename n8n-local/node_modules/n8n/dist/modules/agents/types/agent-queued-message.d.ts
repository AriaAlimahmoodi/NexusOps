import type { SerializableAgentState } from '@n8n/agents';
import type { AgentMessageAuthor } from '@n8n/api-types';
import type { Author } from 'chat';
import type { BridgeExecutionContext } from '../integrations/agent-chat-integration';
import type { IntegrationMessageContext, SessionBinding } from '../integrations/integration-tool-types';
import type { StoredAttachmentRef } from './agent-chat-attachment';
interface QueuedMessageInput {
    message: string;
    resourceId: string;
    attachments?: StoredAttachmentRef[];
}
export interface QueuedUserChatMessage extends QueuedMessageInput {
    kind: 'preview' | 'n8n_chat' | 'system';
    userId: string;
    messageId?: string;
    options?: Record<string, unknown>;
    hidden?: boolean;
}
export declare const acceptsSteering: (kind: AgentQueuedMessage['kind']) => boolean;
export interface QueuedIntegrationMessage extends QueuedMessageInput {
    kind: 'integration';
    credentialId: string;
    platformThreadId: string;
    modelMessage: string;
    author: AgentMessageAuthor;
    sender: Author;
    messageContext: IntegrationMessageContext;
    contextConversation: SessionBinding;
    forceBuffered?: boolean;
    slackThreadContext?: BridgeExecutionContext['slackThreadContext'];
}
export type AgentQueuedMessage = QueuedUserChatMessage | QueuedIntegrationMessage;
export type AgentQueueDispatch = {
    kind: QueuedUserChatMessage['kind'];
    options?: Record<string, unknown>;
} | (Omit<QueuedIntegrationMessage, keyof QueuedMessageInput | 'modelMessage' | 'author' | 'platformThreadId' | 'messageContext'> & {
    messageContext: Omit<IntegrationMessageContext, 'platform' | 'integrationConnectionId' | 'messageId'>;
});
export interface AgentExecutionAdmission {
    executionId: string;
    startedAt: Date;
    inputMessageIds: string[];
}
export declare const EXECUTION_METADATA_KEY = "n8nExecutionId";
export declare function checkpointExecutionId(state: SerializableAgentState): string | undefined;
export {};
