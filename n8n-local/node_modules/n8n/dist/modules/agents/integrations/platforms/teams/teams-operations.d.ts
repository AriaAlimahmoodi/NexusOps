import type { ChatInstance } from '../../chat-integration.service';
import type { IntegrationContextQuery } from '../../integration-tool-types';
export declare function executeTeamsContextQuery(params: {
    chat: ChatInstance;
    query: IntegrationContextQuery;
    input: Record<string, unknown>;
}): Promise<unknown>;
