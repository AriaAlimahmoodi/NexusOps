import type { ExecutionSummaries } from '@n8n/db';
import { ExecutionListRepository, ExecutionRepository } from '@n8n/db';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import { EngineV2ExecutionReader, type V2Scope } from './engine-v2-execution-reader.service';
import type { ExecutionCursor } from './execution-cursor';
import { ExecutionListV1Service, type ListExecutionsResponse } from './execution-list-v1.service';
export declare class ExecutionListV2Service {
    private readonly executionListV1Service;
    private readonly executionRepository;
    private readonly executionListRepository;
    private readonly reader;
    private readonly dataPlane;
    constructor(executionListV1Service: ExecutionListV1Service, executionRepository: ExecutionRepository, executionListRepository: ExecutionListRepository, reader: EngineV2ExecutionReader, dataPlane: EngineDataPlaneProxyService);
    findPageWithCount(query: ExecutionSummaries.RangeQuery, cursor?: ExecutionCursor): Promise<ListExecutionsResponse>;
    findCurrentAndCompleted(query: ExecutionSummaries.RangeQuery): Promise<ListExecutionsResponse>;
    private findCurrentMerged;
    private findPageMerged;
    resolveV2Scope(query: ExecutionSummaries.RangeQuery): Promise<V2Scope | null>;
    private v1Page;
    private v2Page;
    private toV2Query;
    private resolveWorkflowNames;
    private findCurrentExecutionsV2;
    private buildCtx;
}
