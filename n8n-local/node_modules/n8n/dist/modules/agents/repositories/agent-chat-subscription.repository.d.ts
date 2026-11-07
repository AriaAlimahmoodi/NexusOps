import { DataSource, Repository } from '@n8n/typeorm';
import { AgentChatSubscription } from '../entities/agent-chat-subscription.entity';
import type { AgentChannelRef } from '../utils/agent-channel';
export declare class AgentChatSubscriptionRepository extends Repository<AgentChatSubscription> {
    constructor(dataSource: DataSource);
    subscribe(scope: AgentChannelRef, threadId: string): Promise<void>;
    unsubscribe(scope: AgentChannelRef, threadId: string): Promise<void>;
    deleteForConnection(scope: AgentChannelRef): Promise<void>;
    isSubscribed(scope: AgentChannelRef, threadId: string): Promise<boolean>;
    listThreadIdsForConnection(scope: AgentChannelRef): Promise<string[]>;
}
