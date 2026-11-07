import type { IExecutionResponse } from '@n8n/db';
import type { ExecutionStatus as ExecutionStatusV1, WorkflowExecuteMode, ExecutionSummary, Workflow } from 'n8n-workflow';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import type { ExecutionPosition } from './execution-cursor';
import type { ExecutionIdV2 } from './execution-id';
export type V2Scope = 'all' | ReadonlyArray<Workflow['id']>;
export interface EngineV2SearchQuery {
    status?: ExecutionStatusV1[];
    mode?: WorkflowExecuteMode;
    startedAfter?: string;
    startedBefore?: string;
    before?: ExecutionPosition;
    limit: number;
    order?: {
        top?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
        startedAt?: 'DESC';
    };
}
export declare class EngineV2ExecutionReader {
    private readonly dataPlane;
    constructor(dataPlane: EngineDataPlaneProxyService);
    findMany(query: EngineV2SearchQuery, scope: V2Scope, options?: {
        includeTotal?: boolean;
    }): Promise<{
        items: ExecutionSummary[];
        total: number;
        hasMore: boolean;
    }>;
    private empty;
    private searchableScope;
    private buildSearchRequest;
    private toExecutionSummary;
    findReference(executionId: ExecutionIdV2): Promise<{
        id: string;
        workflowId: string;
    } | undefined>;
    findOne(executionId: ExecutionIdV2, sharedWorkflowIds: string[]): Promise<IExecutionResponse | undefined>;
    private toExecutionResponse;
}
