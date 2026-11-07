import { GetResourceDependenciesDto, GetResourceDependencyCountsDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { WorkflowDependencyQueryService } from './workflow-dependency-query.service';
export declare class WorkflowDependencyController {
    private readonly workflowDependencyQueryService;
    constructor(workflowDependencyQueryService: WorkflowDependencyQueryService);
    getResourceDependencyCounts(req: AuthenticatedRequest, _res: unknown, body: GetResourceDependencyCountsDto): Promise<import("@n8n/api-types").DependencyCountsBatchResponse>;
    getResourceDependencies(req: AuthenticatedRequest, _res: unknown, body: GetResourceDependenciesDto): Promise<import("@n8n/api-types").DependenciesBatchResponse>;
    getFolderDependencies(req: AuthenticatedRequest<{
        projectId: string;
        folderId: string;
    }>): Promise<import("@n8n/api-types").ResolvedDependency[]>;
}
