import type { InboxCategory, InboxCounts, InboxItem, InboxSourceType, InboxState } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
export type InboxSourceBoundary = {
    mode: 'beforeTime';
    updatedAt: Date;
} | {
    mode: 'beforeOrAtTime';
    updatedAt: Date;
} | {
    mode: 'afterItem';
    updatedAt: Date;
    id: string;
};
export type InboxSourceQuery = {
    state: InboxState;
    category?: InboxCategory;
    limit: number;
    boundary?: InboxSourceBoundary;
};
export interface InboxSource {
    type: InboxSourceType;
    isEnabled(): Promise<boolean>;
    list(user: User, query: InboxSourceQuery): Promise<InboxItem[]>;
    count(user: User): Promise<InboxCounts>;
}
export declare class InboxSourceRegistry {
    private readonly logger;
    private readonly sources;
    constructor(logger: Logger);
    register(source: InboxSource): void;
    find(type: InboxSourceType): InboxSource | undefined;
    types(): ("self_healing_result" | "workflow_review")[];
    getAllAvailable(types?: ("self_healing_result" | "workflow_review")[]): Promise<{
        available: InboxSource[];
        failedSources: ("self_healing_result" | "workflow_review")[];
        disabledSources: ("self_healing_result" | "workflow_review")[];
    }>;
}
