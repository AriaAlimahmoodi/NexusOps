import type { ChatInstance } from '../../chat-integration.service';
import type { IntegrationContextQuery } from '../../integration-tools';
export declare function executeSlackContextQuery(params: {
    chat: ChatInstance;
    query: IntegrationContextQuery;
    input: Record<string, unknown>;
}): Promise<unknown>;
export declare function subscribeSlackThread(thread: {
    subscribe?: () => Promise<void>;
}): Promise<void>;
