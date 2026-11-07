import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { SchedulerConfig, WorkflowsConfig } from '@n8n/config';
import type { CreateExecutionPayload, PollerCursor, PollLeaseFence } from '@n8n/db';
import { PollerStateRepository, TransactionRunner } from '@n8n/db';
import type { PollCursor } from 'n8n-workflow';
import { ExecutionPersistence } from '../../executions/execution-persistence';
export declare class PollCursorService {
    private readonly logger;
    private readonly pollerStateRepository;
    private readonly transactionRunner;
    private readonly executionPersistence;
    private readonly schedulerConfig;
    private readonly workflowsConfig;
    private readonly eventService;
    constructor(logger: Logger, pollerStateRepository: PollerStateRepository, transactionRunner: TransactionRunner, executionPersistence: ExecutionPersistence, schedulerConfig: SchedulerConfig, workflowsConfig: WorkflowsConfig, eventService: EventService);
    private get schedulerChainEnabled();
    private measureCommit;
    get enabled(): boolean;
    resolveCursor(workflowId: string, nodeId: string, nodeStaticData: PollCursor, prefetchedCursor?: PollerCursor): Promise<{
        migrated: true;
        cursor: PollCursor;
    } | {
        migrated: false;
    }>;
    commitWithExecution(args: {
        workflowId: string;
        nodeId: string;
        cursor: PollCursor;
        payload: CreateExecutionPayload;
        fence?: PollLeaseFence;
    }): Promise<{
        executionId: string;
    } | null>;
    commitCursorOnly(args: {
        workflowId: string;
        nodeId: string;
        cursor: PollCursor;
        fence?: PollLeaseFence;
    }): Promise<boolean>;
}
