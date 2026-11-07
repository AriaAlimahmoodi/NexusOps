import { Logger } from '@n8n/backend-common';
import type { InstanceAiConversationHistoryReader } from '@n8n/instance-ai';
import { InstanceAiConversationHistoryRepository } from './repositories/instance-ai-conversation-history.repository';
export interface ScopedConversationHistory extends InstanceAiConversationHistoryReader {
    getPastConversationsSection(): Promise<string | undefined>;
}
export declare class InstanceAiConversationHistoryService {
    private readonly repository;
    private readonly logger;
    constructor(logger: Logger, repository: InstanceAiConversationHistoryRepository);
    forContext(userId: string, projectId: string, currentThreadId: string): ScopedConversationHistory;
    private getPastConversationsSection;
    private search;
    private verifyHits;
    private listRecent;
    private buildExcerpts;
    private getMessages;
    private resolveWindow;
}
