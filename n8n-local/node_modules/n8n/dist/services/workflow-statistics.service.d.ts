import { Logger, TypedEmitter } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { DatabaseConfig } from '@n8n/config';
import type { CrashedExecution } from '@n8n/db';
import { SettingsRepository, StatisticsNames, WorkflowRepository, WorkflowStatisticsRepository } from '@n8n/db';
import { type INode, type IRun, type IWorkflowBase, type WorkflowExecutionSource } from 'n8n-workflow';
import { UserService } from '../services/user.service';
import { OwnershipService } from './ownership.service';
type WorkflowStatisticsEvents = {
    nodeFetchedData: {
        workflowId: string;
        node: INode;
        source?: WorkflowExecutionSource;
    };
    workflowExecutionCompleted: {
        workflowData: IWorkflowBase;
        fullRunData: IRun;
        source?: WorkflowExecutionSource;
    };
    executionsCrashed: {
        executions: CrashedExecution[];
    };
};
export declare class WorkflowStatisticsService extends TypedEmitter<WorkflowStatisticsEvents> {
    private readonly logger;
    private readonly repository;
    private readonly ownershipService;
    private readonly userService;
    private readonly eventService;
    private readonly settingsRepository;
    private readonly workflowRepository;
    private readonly databaseConfig;
    constructor(logger: Logger, repository: WorkflowStatisticsRepository, ownershipService: OwnershipService, userService: UserService, eventService: EventService, settingsRepository: SettingsRepository, workflowRepository: WorkflowRepository, databaseConfig: DatabaseConfig);
    workflowExecutionCompleted(workflowData: IWorkflowBase, runData: IRun, source?: WorkflowExecutionSource): Promise<void>;
    private recordExecutionOutcome;
    private recordCompletedRun;
    emitFirstOccurrenceEvent(statisticsName: StatisticsNames, workflowId: string, workflowName: string | null, firstEventMs: number): Promise<void>;
    private emitFirstProductionWorkflowSucceeded;
    private emitInstanceFirstProductionWorkflowFailed;
    nodeFetchedData(workflowId: string | undefined | null, node: INode, source?: WorkflowExecutionSource): Promise<void>;
}
export {};
