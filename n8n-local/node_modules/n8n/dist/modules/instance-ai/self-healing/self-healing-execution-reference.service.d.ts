import type { SelfHealingExecutionReference } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ExecutionRepository, type User } from '@n8n/db';
import { EngineV2ExecutionReader } from '../../../executions/engine-v2-execution-reader.service';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
export declare class SelfHealingExecutionReferenceService {
    private readonly executions;
    private readonly engineV2;
    private readonly workflows;
    private readonly logger;
    constructor(executions: ExecutionRepository, engineV2: EngineV2ExecutionReader, workflows: WorkflowFinderService, logger: Logger);
    getReference(user: User, workflowId: string, executionId: string): Promise<SelfHealingExecutionReference>;
    validateReference(user: User, workflowId: string, executionId: string): Promise<void>;
    private canReadExecution;
    private findReference;
}
