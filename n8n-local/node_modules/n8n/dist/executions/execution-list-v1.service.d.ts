import type { SerializedCursor } from '@n8n/api-types';
import { DatabaseConfig } from '@n8n/config';
import type { ExecutionSummaries } from '@n8n/db';
import { ExecutionRepository } from '@n8n/db';
import { type ExecutionStatus, type ExecutionSummary } from 'n8n-workflow';
import { type ExecutionCursor } from './execution-cursor';
export interface ListExecutionsResponse {
    results: ExecutionSummary[];
    nextCursor: SerializedCursor | null;
    count: number;
    estimated: boolean;
}
export declare const CURRENT_STATUSES: ExecutionStatus[];
export declare const COMPLETED_STATUSES: ("canceled" | "crashed" | "error" | "new" | "running" | "success" | "unknown" | "waiting")[];
export declare class ExecutionListV1Service {
    private readonly databaseConfig;
    private readonly executionRepository;
    constructor(databaseConfig: DatabaseConfig, executionRepository: ExecutionRepository);
    findPageWithCount(query: ExecutionSummaries.RangeQuery, cursor?: ExecutionCursor): Promise<ListExecutionsResponse>;
    findCurrentAndCompleted(query: ExecutionSummaries.RangeQuery): Promise<ListExecutionsResponse>;
    findCurrentExecutions(query: ExecutionSummaries.RangeQuery): Promise<ExecutionSummary[]>;
    private nextCursorFor;
    getExecutionsCountForQuery(countQuery: ExecutionSummaries.CountQuery): Promise<{
        count: number;
        estimated: boolean;
    }>;
}
