import type { PushPayload } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { Push } from '../../push';
import type { PubSubCommandMap } from '../../scaling/pubsub/pubsub.event-map';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { AgentPushRecipientsService } from './agent-push-recipients.service';
import { AgentExecutionThreadRepository } from './repositories/agent-execution-thread.repository';
type AgentExecutionUpdate = PushPayload<'agentExecutionUpdated'>;
export declare class AgentExecutionUpdateBroadcaster {
    private readonly logger;
    private readonly recipients;
    private readonly push;
    private readonly publisher;
    private readonly instanceSettings;
    private readonly threadRepository;
    constructor(logger: Logger, recipients: AgentPushRecipientsService, push: Push, publisher: Publisher, instanceSettings: InstanceSettings, threadRepository: AgentExecutionThreadRepository);
    notify(data: AgentExecutionUpdate): void;
    private broadcast;
    notifyBackgroundJobsUpdated(agentId: string, threadId: string): void;
    private broadcastBackgroundJobsUpdated;
    notifyQueueUpdated(threadId: string): void;
    private broadcastQueueUpdated;
    handleQueueRelay({ data, userIds }: PubSubCommandMap['relay-agent-message-queue-update']): void;
    private getRecipients;
    handleBackgroundJobsRelay({ data, userIds, }: PubSubCommandMap['relay-agent-background-tasks-update']): void;
    handleRelay({ data, userIds }: PubSubCommandMap['relay-agent-execution-update']): void;
}
export {};
