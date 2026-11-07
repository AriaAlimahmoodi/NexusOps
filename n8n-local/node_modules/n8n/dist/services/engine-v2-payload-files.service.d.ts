import { Logger } from '@n8n/backend-common';
import { BinaryDataService } from 'n8n-core';
import type { INodeExecutionData } from 'n8n-workflow';
import type { ExecutionIdV2 } from '../executions/execution-id';
type PayloadSlots = Array<INodeExecutionData[] | null | undefined>;
export declare class EngineV2PayloadFiles {
    private readonly binaryDataService;
    private readonly logger;
    constructor(binaryDataService: BinaryDataService, logger: Logger);
    claimForExecution(slots: PayloadSlots, executionId: ExecutionIdV2): Promise<void>;
    discard(slots: PayloadSlots): Promise<void>;
    private storedFilesIn;
}
export {};
