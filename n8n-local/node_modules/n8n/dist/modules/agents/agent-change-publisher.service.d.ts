import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { PubSub } from '../../scaling/pubsub/pubsub.types';
import { Publisher } from '../../scaling/pubsub/publisher.service';
type AgentChange = Extract<PubSub.Command, {
    command: 'agent-config-changed' | 'agent-tasks-changed' | 'agent-chat-integration-changed' | 'agent-chat-subscription-changed';
}>;
export declare class AgentChangePublisher {
    private readonly publisher;
    private readonly globalConfig;
    private readonly logger;
    constructor(publisher: Publisher, globalConfig: GlobalConfig, logger: Logger);
    publish(change: AgentChange): Promise<void>;
}
export {};
