import type { ExecutionSummaries, User } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
import { RoleService, WorkflowSharingService } from '@n8n/backend-services';
import { type ExecutionCursor } from './execution-cursor';
import { ExecutionListV1Service, type ListExecutionsResponse } from './execution-list-v1.service';
export declare class ExecutionListService {
    private readonly v1Service;
    private readonly dataPlane;
    private readonly workflowSharingService;
    private readonly roleService;
    constructor(v1Service: ExecutionListV1Service, dataPlane: EngineDataPlaneProxyService, workflowSharingService: WorkflowSharingService, roleService: RoleService);
    listExecutionsForUI(query: ExecutionSummaries.RangeQuery, cursor?: ExecutionCursor): Promise<ListExecutionsResponse>;
    findPageWithCount(query: ExecutionSummaries.RangeQuery, cursor?: ExecutionCursor): Promise<ListExecutionsResponse>;
    addScopes(user: User, summaries: ExecutionSummaries.ExecutionSummaryWithScopes[]): Promise<void>;
    buildSharingOptions(scope: Scope): Promise<ExecutionSummaries.RangeQuery['sharingOptions']>;
    private provider;
}
