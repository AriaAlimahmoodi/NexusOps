import { Logger } from '@n8n/backend-common';
import { ExecutionRepository } from '@n8n/db';
import { ExecutionPersistence } from '../../executions/execution-persistence';
export declare class ExecutionsPruningService {
    private readonly logger;
    private readonly executionRepository;
    private readonly executionPersistence;
    constructor(logger: Logger, executionRepository: ExecutionRepository, executionPersistence: ExecutionPersistence);
    softDelete(): Promise<void>;
    hardDelete(signal: AbortSignal): Promise<void>;
    private hardDeleteBatch;
    private hardDeleteOneByOne;
    private waitBetweenBatches;
}
