import { Logger } from '@n8n/backend-common';
import { SchedulerConfig, WorkflowsConfig } from '@n8n/config';
import type { PollerFailureState, PollerFullState } from '@n8n/db';
import { PollerStateRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
export declare class PollBackoffService {
    private readonly pollerStateRepository;
    private readonly schedulerConfig;
    private readonly workflowsConfig;
    private logger;
    private readonly errorReporter;
    constructor(pollerStateRepository: PollerStateRepository, schedulerConfig: SchedulerConfig, workflowsConfig: WorkflowsConfig, logger: Logger, errorReporter: ErrorReporter);
    get enabled(): boolean;
    getState(workflowId: string, nodeId: string): Promise<PollerFullState | null>;
    isBackingOff(state: PollerFailureState | null, now: Date): boolean;
    recordFailure(args: {
        workflowId: string;
        nodeId: string;
        error: unknown;
        state: PollerFailureState | null;
        now: Date;
    }): Promise<void>;
    recordSuccess(args: {
        workflowId: string;
        nodeId: string;
        state: PollerFailureState | null;
    }): Promise<void>;
    reset(workflowId: string, nodeId: string): Promise<void>;
    private reportFailure;
}
