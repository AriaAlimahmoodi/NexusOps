import { LicenseMetricsRepository, ScheduledJobRepository, ScheduledTaskRepository, WorkflowPublicationOutboxRepository, type WorkflowPublicationOutboxStatus, WorkflowRepository } from '@n8n/db';
import { CachedMetricQueryFactory } from './cached-metric-query';
export type WorkflowStatistics = Awaited<ReturnType<LicenseMetricsRepository['getLicenseRenewalMetrics']>>;
export type DurableJobState = {
    task: string;
    runnable: boolean;
    nextRunAtSeconds: number | null;
};
export declare class DatabaseMetricQueryService {
    private readonly cachedQueries;
    private readonly workflowRepository;
    private readonly licenseMetricsRepository;
    private readonly outboxRepository;
    private readonly taskRepository;
    private readonly jobRepository;
    constructor(cachedQueries: CachedMetricQueryFactory, workflowRepository: WorkflowRepository, licenseMetricsRepository: LicenseMetricsRepository, outboxRepository: WorkflowPublicationOutboxRepository, taskRepository: ScheduledTaskRepository, jobRepository: ScheduledJobRepository);
    activeWorkflowCount(ttlMs: number): import("./cached-metric-query").CachedMetricQuery<number>;
    workflowInfo(ttlMs: number, activeOnly: boolean): import("./cached-metric-query").CachedMetricQuery<{
        id: string;
        name: string;
    }[]>;
    workflowStatistics(ttlMs: number): import("./cached-metric-query").CachedMetricQuery<{
        enabledUsers: number;
        totalUsers: number;
        activeWorkflows: number;
        totalWorkflows: number;
        totalCredentials: number;
        productionExecutions: number;
        productionRootExecutions: number;
        manualExecutions: number;
        evaluations: number;
    }>;
    workflowPublication(ttlMs: number): import("./cached-metric-query").CachedMetricQuery<Partial<Record<WorkflowPublicationOutboxStatus, {
        count: number;
        oldestMs: number;
    }>>>;
    schedulerSnapshot(ttlMs: number): import("./cached-metric-query").CachedMetricQuery<import("@n8n/db").ScheduledTaskMetricSnapshot>;
    durableSystemTaskJobs(ttlMs: number): import("./cached-metric-query").CachedMetricQuery<DurableJobState[]>;
}
