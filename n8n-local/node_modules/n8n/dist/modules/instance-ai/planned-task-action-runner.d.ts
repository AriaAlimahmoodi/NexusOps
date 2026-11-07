import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { type PlannedTaskGraph, type PlannedTaskRecord, type PlannedTaskSchedulerAction, type PlannedTaskService, type PlannedWorkflowVerification, type WorkflowBuildOutcome } from '@n8n/instance-ai';
export type PlannedBuildFollowUp = {
    isPlannedBuildFollowUp: true;
    buildTaskId: string;
    workItemId: string;
    isSupportingWorkflowTask?: boolean;
    savedOutcome?: WorkflowBuildOutcome;
};
export type PlannedTaskRunScope = {
    user: User;
    threadId: string;
};
export type PlannedTaskActionRunnerResult = {
    type: 'done';
} | {
    type: 'continue-scheduling';
};
export type PlannedTaskView = {
    sync(scope: PlannedTaskRunScope, graph: PlannedTaskGraph): Promise<void>;
};
export type PlannedTaskRunGate = {
    hasLiveRun(threadId: string): boolean;
};
export type PlannedTaskDispatcher = {
    dispatch(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
        tasks: PlannedTaskRecord[];
    }): Promise<void>;
};
export type PlannedTaskFollowUpStarter = {
    startReplan(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
        failedTask: PlannedTaskRecord;
    }): Promise<string>;
    startWorkflowVerification(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
        verification: PlannedWorkflowVerification;
    }): Promise<string>;
    startSynthesis(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
    }): Promise<string>;
    startWorkflowBuild(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
        task: PlannedTaskRecord;
        workItemId: string;
    }): Promise<string>;
    startCheckpoint(input: {
        scope: PlannedTaskRunScope;
        graph: PlannedTaskGraph;
        task: PlannedTaskRecord;
    }): Promise<string>;
};
export type PlannedWorkflowVerificationTracker = {
    scheduled(verification: PlannedWorkflowVerification): void;
    followUpStartAttempted(verification: PlannedWorkflowVerification, started: boolean): void;
};
export type PlannedWorkflowVerificationGate = {
    revalidate(verification: PlannedWorkflowVerification): Promise<PlannedWorkflowVerification | undefined>;
};
type PlannedTaskActionRunnerDeps = {
    scope: PlannedTaskRunScope;
    plannedTaskService: PlannedTaskService;
    logger: Logger;
    view: PlannedTaskView;
    runGate: PlannedTaskRunGate;
    dispatcher: PlannedTaskDispatcher;
    followUps: PlannedTaskFollowUpStarter;
    workflowVerificationGate: PlannedWorkflowVerificationGate;
    workflowVerificationTracker: PlannedWorkflowVerificationTracker;
};
export declare class PlannedTaskActionRunner {
    private readonly deps;
    constructor(deps: PlannedTaskActionRunnerDeps);
    run(action: Exclude<PlannedTaskSchedulerAction, {
        type: 'none';
    }>): Promise<PlannedTaskActionRunnerResult>;
    private runReplan;
    private runWorkflowVerification;
    private runSynthesize;
    private runWorkflowBuild;
    private runCheckpoint;
    private runDispatch;
}
export {};
