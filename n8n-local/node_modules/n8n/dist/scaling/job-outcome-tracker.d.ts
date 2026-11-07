import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { ExecutionRepository } from '@n8n/db';
import { ActiveExecutions } from '../active-executions';
import type { Job, JobFinishedProps, JobId } from './scaling.types';
type PendingJobWait = {
    executionId: string;
    resolve: () => void;
    reject: (error: Error) => void;
};
export declare class JobOutcomeTracker {
    private readonly logger;
    private readonly activeExecutions;
    private readonly executionRepository;
    private readonly eventService;
    private readonly results;
    private readonly failures;
    private readonly pendingWaits;
    private recheckTimer?;
    private recheckInFlight?;
    constructor(logger: Logger, activeExecutions: ActiveExecutions, executionRepository: ExecutionRepository, eventService: EventService);
    getDiagnosticCounts(): {
        jobResults: number;
    };
    recordFinished(queueName: string, jobId: JobId, executionId: string, result?: JobFinishedProps): void;
    recordFailed(queueName: string, jobId: JobId, executionId: string, error: Error): void;
    private acceptsReport;
    settleByJobKey(queueName: string, jobId: JobId, error?: Error): void;
    waitFor(job: Job): Promise<void>;
    popResult(job: Job): JobFinishedProps | undefined;
    drop(job: Job): PendingJobWait | undefined;
    private dropByJobKey;
    clear(): void;
    recheckAll(): Promise<void>;
    private recheckPendingWaits;
    private readStatuses;
    private settle;
    private startRecheckTimer;
    private stopRecheckTimer;
}
export {};
