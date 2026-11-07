import type { AgentIntegrationConfig } from '@n8n/api-types';
import type { StateAdapter } from 'chat';
import type { PubSubCommandMap } from '../../../scaling/pubsub/pubsub.event-map';
import { AgentChangePublisher } from '../agent-change-publisher.service';
import { AgentChatSubscriptionRepository } from '../repositories/agent-chat-subscription.repository';
interface CreateStateAdapterOptions {
    agentId: string;
    integration: AgentIntegrationConfig;
    delegate: StateAdapter;
}
export declare class AgentChatSubscriptionStateService {
    private readonly repository;
    private readonly changePublisher;
    private readonly activeStates;
    constructor(repository: AgentChatSubscriptionRepository, changePublisher: AgentChangePublisher);
    createStateAdapter(options: CreateStateAdapterOptions): StateAdapter;
    deleteSubscriptionsForIntegration(agentId: string, integration: AgentIntegrationConfig): Promise<void>;
    handleSubscriptionChanged(payload: PubSubCommandMap['agent-chat-subscription-changed']): Promise<void>;
    private unregister;
}
export {};
