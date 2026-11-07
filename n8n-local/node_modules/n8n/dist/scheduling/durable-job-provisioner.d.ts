import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { ScheduledJobMisfirePolicy } from '@n8n/constants';
import type { EntityManager, ScheduledJobOwner, ScheduledJobOwnerRef } from '@n8n/db';
import { DataSource, ScheduledJobRepository, ScheduledTaskRepository } from '@n8n/db';
import type { DesiredJob, ProvisionSummary } from '@n8n/scheduler';
import { Tracing } from 'n8n-core';
import { AgentScheduledJobOwner } from './agent-scheduled-job-owner';
import { SystemTaskScheduledJobOwner } from './system-tasks/system-task-scheduled-job-owner';
import { WorkflowScheduledJobOwner } from './workflow-scheduled-job-owner';
export interface ProvisionRequest {
    owner: ScheduledJobOwner;
    taskType: string;
    payload: Record<string, unknown>;
    desired: DesiredJob[];
    misfirePolicy: ScheduledJobMisfirePolicy;
    misfireGraceSeconds?: number;
    maxAttempts?: number;
    timeoutSeconds?: number;
    concurrencyLimit?: number | null;
}
export interface ObservedJob {
    id: number;
    payload: Record<string, unknown>;
}
export declare class DurableJobProvisioner {
    private readonly logger;
    private readonly dataSource;
    private readonly jobs;
    private readonly tasks;
    private readonly globalConfig;
    private readonly provisioner;
    constructor(logger: Logger, dataSource: DataSource, jobs: ScheduledJobRepository, tasks: ScheduledTaskRepository, globalConfig: GlobalConfig, workflowOwner: WorkflowScheduledJobOwner, agentOwner: AgentScheduledJobOwner, systemTaskOwner: SystemTaskScheduledJobOwner, tracing: Tracing);
    provision({ desired, ...scope }: ProvisionRequest): Promise<ProvisionSummary>;
    deprovisionOwnerMember(owner: ScheduledJobOwner): Promise<{
        removed: number;
    }>;
    deprovisionOwner(owner: ScheduledJobOwnerRef): Promise<{
        removed: number;
    }>;
    deprovisionOwnerTaskType(owner: ScheduledJobOwnerRef, taskType: string): Promise<{
        removed: number;
    }>;
    deprovisionUnchangedJob(job: ObservedJob): Promise<{
        removed: number;
    }>;
    deprovisionOwnerInTransaction(manager: EntityManager, owner: ScheduledJobOwnerRef): Promise<void>;
    deprovisionOwnerTaskTypeInTransaction(manager: EntityManager, owner: ScheduledJobOwnerRef, taskType: string): Promise<void>;
    private provisionTransaction;
    private resolveRunOptions;
    private deprovisionTransaction;
    private deleteScope;
}
