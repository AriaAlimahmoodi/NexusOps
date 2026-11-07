import type { PushPayload } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { Push } from '../../push';
import type { PubSubCommandMap } from '../../scaling/pubsub/pubsub.event-map';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { AgentPushRecipientsService } from './agent-push-recipients.service';
type AgentUpdate = PushPayload<'agentUpdated'>;
export declare class AgentUpdateBroadcaster {
    private readonly logger;
    private readonly recipients;
    private readonly push;
    private readonly publisher;
    private readonly instanceSettings;
    constructor(logger: Logger, recipients: AgentPushRecipientsService, push: Push, publisher: Publisher, instanceSettings: InstanceSettings);
    notify(data: AgentUpdate, excludePushRef?: string): void;
    private broadcast;
    handleRelay({ data, userIds, excludePushRef }: PubSubCommandMap['relay-agent-update']): void;
}
export {};
