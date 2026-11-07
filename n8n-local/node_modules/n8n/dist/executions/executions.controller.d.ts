import { DeleteExecutionsDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { License } from '../license';
import { WorkflowSharingService } from '@n8n/backend-services';
import { ExecutionListService } from './execution-list.service';
import { ExecutionService } from './execution.service';
import { EnterpriseExecutionsService } from './execution.service.ee';
import { ExecutionRequest } from './execution.types';
export declare class ExecutionsController {
    private readonly executionService;
    private readonly enterpriseExecutionService;
    private readonly workflowSharingService;
    private readonly license;
    private readonly executionListService;
    constructor(executionService: ExecutionService, enterpriseExecutionService: EnterpriseExecutionsService, workflowSharingService: WorkflowSharingService, license: License, executionListService: ExecutionListService);
    private getAccessibleWorkflowIds;
    getMany(req: ExecutionRequest.GetMany): Promise<{
        results: import("n8n-workflow").ExecutionSummary[];
        nextCursor: import("@n8n/api-types").SerializedCursor | null;
        count: number;
        estimated: boolean;
        concurrentExecutionsCount: number;
    }>;
    getVersions(req: ExecutionRequest.GetVersions): Promise<{
        versionId: string;
        name: string | null;
        createdAt: Date;
    }[]>;
    getOne(req: ExecutionRequest.GetOne): Promise<import("../interfaces").IExecutionFlattedResponse | undefined>;
    stop(req: ExecutionRequest.Stop): Promise<import("./execution.types").StopResult>;
    stopMany(req: ExecutionRequest.StopMany): Promise<{
        stopped: number;
    }>;
    retry(req: ExecutionRequest.Retry): Promise<Omit<import("@n8n/db").IExecutionResponse, "createdAt">>;
    delete(req: AuthenticatedRequest, _res: Response, payload: DeleteExecutionsDto): Promise<void>;
    update(req: ExecutionRequest.Update): Promise<import("../interfaces").IExecutionFlattedResponse | undefined>;
    private assertKnownExecutionId;
}
