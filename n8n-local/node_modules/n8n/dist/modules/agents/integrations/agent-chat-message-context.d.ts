import type { AgentIntegrationConfig } from '@n8n/api-types';
import type { Message, Thread } from 'chat';
import type { Logger } from 'n8n-workflow';
import type { IntegrationMessageContextService } from './integration-message-context.service';
import { type IntegrationMessageContext, type IntegrationMessageSubject, type IntegrationPlatformMessageContext, type ReplyExpectation, type SessionBinding } from './integration-tools';
interface CaptureMessageContextOptions {
    messageId?: string;
    interactingUserId?: string;
    agentUserId?: string;
    platformMessage?: IntegrationPlatformMessageContext;
    subject?: IntegrationMessageSubject;
    replyExpectation?: ReplyExpectation;
}
export declare class AgentChatMessageContextBridge {
    private readonly messageContextStore;
    private readonly integration;
    private readonly agentId;
    private readonly logger;
    constructor(messageContextStore: IntegrationMessageContextService | undefined, integration: AgentIntegrationConfig, agentId: string, logger: Logger);
    capture(thread: Thread<unknown, unknown>, options?: CaptureMessageContextOptions): IntegrationMessageContext;
    resolveSubject(message: Message<unknown>): Promise<IntegrationMessageSubject | undefined>;
    resolveSession(threadId: string): Promise<SessionBinding | null>;
    unbindSession(threadId: string): Promise<void>;
}
export {};
