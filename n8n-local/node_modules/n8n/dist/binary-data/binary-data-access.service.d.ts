import type { User } from '@n8n/db';
import { BinaryDataRepository, ExecutionRepository } from '@n8n/db';
import { WorkflowSharingService } from '@n8n/backend-services';
import { EngineDataPlaneProxyService } from '../services/engine-data-plane-proxy.service';
export declare class BinaryDataAccessService {
    private readonly workflowSharingService;
    private readonly executionRepository;
    private readonly binaryDataRepository;
    private readonly dataPlane;
    constructor(workflowSharingService: WorkflowSharingService, executionRepository: ExecutionRepository, binaryDataRepository: BinaryDataRepository, dataPlane: EngineDataPlaneProxyService);
    hasReadAccess(user: User, binaryDataId: string): Promise<boolean>;
    private resolveAccessSource;
    private resolveEngineV2Execution;
}
