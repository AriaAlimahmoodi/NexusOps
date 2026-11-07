import { Logger } from '@n8n/backend-common';
import { SettingsRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { AgentChatAttachmentService } from './agent-chat-attachment.service';
import { AgentExecutionUpdateBroadcaster } from './agent-execution-update-broadcaster';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
import { AgentMessageQueueRepository } from './repositories/agent-message-queue.repository';
import { AgentMessageRepository } from './repositories/agent-message.repository';
export declare class AgentsSettingsService {
    private readonly settingsRepository;
    private readonly txRunner;
    private readonly queue;
    private readonly threads;
    private readonly messages;
    private readonly attachments;
    private readonly updates;
    private readonly logger;
    constructor(settingsRepository: SettingsRepository, txRunner: TransactionRunner, queue: AgentMessageQueueRepository, threads: AgentExecutionThreadRepository, messages: AgentMessageRepository, attachments: AgentChatAttachmentService, updates: AgentExecutionUpdateBroadcaster, logger: Logger);
    getEnabled(ctx?: OperationContext): Promise<boolean>;
    setEnabled(enabled: boolean): Promise<void>;
    private cancelPendingMessages;
    assertEnabled(ctx?: OperationContext): Promise<void>;
}
