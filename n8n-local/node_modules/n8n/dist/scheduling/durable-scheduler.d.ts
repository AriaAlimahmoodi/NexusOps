import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { DataSource, ScheduledJobRepository, ScheduledTaskRepository } from '@n8n/db';
import type { RunInTransaction, Scheduler, TaskHandler } from '@n8n/scheduler';
import { InstanceSettings, Tracing } from 'n8n-core';
import { PrometheusSchedulerMetricsService } from '../metrics/prometheus/scheduler-metrics.service';
import { AgentScheduledJobOwner } from './agent-scheduled-job-owner';
import { PollTriggerTaskHandler } from './poll-trigger-node/poll-trigger-task-handler';
import { ScheduleTriggerTaskHandler } from './schedule-trigger-node/schedule-trigger-task-handler';
import { SystemTaskScheduledJobOwner } from './system-tasks/system-task-scheduled-job-owner';
import { WorkflowScheduledJobOwner } from './workflow-scheduled-job-owner';
export declare class DurableScheduler implements Scheduler {
    private readonly logger;
    private readonly scheduler;
    constructor(logger: Logger, dataSource: DataSource, jobs: ScheduledJobRepository, tasks: ScheduledTaskRepository, instanceSettings: InstanceSettings, globalConfig: GlobalConfig, tracing: Tracing, scheduleTriggerTaskHandler: ScheduleTriggerTaskHandler, pollTriggerTaskHandler: PollTriggerTaskHandler, metrics: PrometheusSchedulerMetricsService, workflowOwner: WorkflowScheduledJobOwner, agentOwner: AgentScheduledJobOwner, systemTaskOwner: SystemTaskScheduledJobOwner, eventService: EventService);
    isActive(): boolean;
    registerTaskHandler(taskType: string, handler: TaskHandler): void;
    start(): void;
    stop(): Promise<void>;
}
export declare function buildMaterializerTransaction(dataSource: DataSource, jobs: ScheduledJobRepository, tasks: ScheduledTaskRepository): RunInTransaction;
