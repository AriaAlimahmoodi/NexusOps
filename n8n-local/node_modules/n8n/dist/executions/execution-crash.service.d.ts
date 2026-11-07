import { EventService } from '@n8n/backend-services';
import type { CrashedExecution } from '@n8n/db';
import { ExecutionRepository } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import type { CrashDetector } from '../events/maps/relay.event-map';
import { WorkflowStatisticsService } from '../services/workflow-statistics.service';
export declare class ExecutionCrashService {
    private readonly executionRepository;
    private readonly workflowStatisticsService;
    private readonly eventService;
    private readonly instanceSettings;
    constructor(executionRepository: ExecutionRepository, workflowStatisticsService: WorkflowStatisticsService, eventService: EventService, instanceSettings: InstanceSettings);
    markAsCrashed(executionIds: string | string[], detector: CrashDetector): Promise<CrashedExecution[]>;
    markAsCrashedWithoutCounting(executionIds: string | string[], detector: CrashDetector, options?: {
        stoppedAt?: Date;
    }): Promise<CrashedExecution[]>;
    markWorkflowExecutionsAsCrashed(workflowId: string): Promise<CrashedExecution[]>;
    private count;
    private announce;
}
