import { DeletedExecutionPublicDto, ExecutionListPublicDto, ExecutionPublicDto, ExecutionTagsPublicDto, GetExecutionQueryDto, ListExecutionsQueryDto, RetriedExecutionPublicDto, RetryExecutionPublicDto, StopManyExecutionsPublicDto, StoppedExecutionPublicDto, StoppedExecutionsPublicDto, TagIdsPublicDto } from '@n8n/api-types';
import { EventService, WorkflowSharingService, ExecutionRedactionServiceProxy } from '@n8n/backend-services';
import { ExecutionsConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { ExecutionService } from '../../../executions/execution.service';
export declare class ExecutionsPublicController {
    private readonly executionService;
    private readonly workflowSharingService;
    private readonly executionRedactionServiceProxy;
    private readonly executionsConfig;
    private readonly eventService;
    constructor(executionService: ExecutionService, workflowSharingService: WorkflowSharingService, executionRedactionServiceProxy: ExecutionRedactionServiceProxy, executionsConfig: ExecutionsConfig, eventService: EventService);
    getExecutions(req: AuthenticatedRequest, _res: Response, query: ListExecutionsQueryDto): Promise<ExecutionListPublicDto>;
    getExecution(req: AuthenticatedRequest, _res: Response, executionId: string, query: GetExecutionQueryDto): Promise<ExecutionPublicDto>;
    deleteExecution(req: AuthenticatedRequest, _res: Response, executionId: string): Promise<DeletedExecutionPublicDto>;
    getExecutionTags(req: AuthenticatedRequest, _res: Response, executionId: string): Promise<ExecutionTagsPublicDto>;
    updateExecutionTags(req: AuthenticatedRequest, _res: Response, executionId: string, body: TagIdsPublicDto): Promise<ExecutionTagsPublicDto>;
    stopManyExecutions(req: AuthenticatedRequest, _res: Response, body: StopManyExecutionsPublicDto): Promise<StoppedExecutionsPublicDto>;
    stopExecution(req: AuthenticatedRequest, _res: Response, executionId: string): Promise<StoppedExecutionPublicDto>;
    retryExecution(req: AuthenticatedRequest, _res: Response, executionId: string, body: RetryExecutionPublicDto): Promise<RetriedExecutionPublicDto>;
}
