import { type GetInboxSummaryResponse, type InboxSettings, type ListInboxQueryDto, type ListInboxResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { InboxSourceRegistry } from './inbox-source.registry';
export declare class InboxService {
    private readonly registry;
    private readonly logger;
    constructor(registry: InboxSourceRegistry, logger: Logger);
    list(user: User, query: ListInboxQueryDto): Promise<ListInboxResponse>;
    getSummary(user: User): Promise<GetInboxSummaryResponse>;
    getSettings(): Promise<InboxSettings>;
    private boundaryFor;
    private mergeRows;
    private encodeCursor;
    private sourcesForCategory;
    private decodeCursor;
}
