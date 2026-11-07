import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig, WorkflowHistoryCompactionConfig } from '@n8n/config';
import { WorkflowHistoryRepository } from '@n8n/db';
export declare class WorkflowHistoryCompactionService {
    private readonly config;
    private readonly globalConfig;
    private readonly logger;
    private readonly workflowHistoryRepository;
    private readonly eventService;
    private isOptimizingHistories;
    private isTrimmingHistories;
    constructor(config: WorkflowHistoryCompactionConfig, globalConfig: GlobalConfig, logger: Logger, workflowHistoryRepository: WorkflowHistoryRepository, eventService: EventService);
    trimLongRunningHistories(signal: AbortSignal): Promise<void>;
    optimizeHistories(signal: AbortSignal): Promise<void>;
    private startOfToday;
    private compactHistories;
    private waitBetweenBatches;
}
