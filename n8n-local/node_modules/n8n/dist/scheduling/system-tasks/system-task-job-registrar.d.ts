import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { ScheduledJob } from '@n8n/db';
import { ScheduledJobRepository } from '@n8n/db';
import type { SystemTask, SystemTaskRunOptions, SystemTaskSchedule } from '@n8n/decorators';
import { ErrorReporter } from 'n8n-core';
import { DurableJobProvisioner } from '../durable-job-provisioner';
import type { ProvisionRequest } from '../durable-job-provisioner';
import { SystemTaskScheduledJobOwner } from './system-task-scheduled-job-owner';
export type StaleSystemTaskJob = Pick<ScheduledJob, 'id' | 'ownerId' | 'payload'>;
export interface DurableSystemTask {
    readonly task: SystemTask;
    readonly schedule: SystemTaskSchedule;
    readonly runOptions: SystemTaskRunOptions;
}
export declare function durableSystemTask(task: SystemTask): DurableSystemTask;
export declare function systemTaskProvisionRequest({ task, schedule, runOptions }: DurableSystemTask, systemTaskOwner: SystemTaskScheduledJobOwner, defaultTimezone: string, now: Date): ProvisionRequest;
export declare class SystemTaskJobRegistrar {
    private readonly scheduledJobRepository;
    private readonly durableJobProvisioner;
    private readonly systemTaskOwner;
    private readonly globalConfig;
    private readonly errorReporter;
    private readonly eventService;
    private readonly logger;
    constructor(logger: Logger, scheduledJobRepository: ScheduledJobRepository, durableJobProvisioner: DurableJobProvisioner, systemTaskOwner: SystemTaskScheduledJobOwner, globalConfig: GlobalConfig, errorReporter: ErrorReporter, eventService: EventService);
    provision(durableTask: DurableSystemTask): Promise<void>;
    removeStale(): Promise<void>;
    private remove;
    isProvisioned(taskName: string): Promise<boolean>;
    findStale(): Promise<StaleSystemTaskJob[]>;
    private reportFailure;
}
