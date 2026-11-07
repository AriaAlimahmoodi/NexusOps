"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableScheduler = void 0;
exports.buildMaterializerTransaction = buildMaterializerTransaction;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const n8n_core_1 = require("n8n-core");
const scheduler_metrics_service_1 = require("../metrics/prometheus/scheduler-metrics.service");
const agent_scheduled_job_owner_1 = require("./agent-scheduled-job-owner");
const poll_trigger_task_handler_1 = require("./poll-trigger-node/poll-trigger-task-handler");
const schedule_trigger_task_handler_1 = require("./schedule-trigger-node/schedule-trigger-task-handler");
const scheduled_job_owner_registry_1 = require("./scheduled-job-owner-registry");
const scheduler_tracer_1 = require("./scheduler-tracer");
const system_task_overlap_reporter_1 = require("./system-tasks/system-task-overlap-reporter");
const system_task_scheduled_job_owner_1 = require("./system-tasks/system-task-scheduled-job-owner");
const workflow_scheduled_job_owner_1 = require("./workflow-scheduled-job-owner");
let DurableScheduler = class DurableScheduler {
    constructor(logger, dataSource, jobs, tasks, instanceSettings, globalConfig, tracing, scheduleTriggerTaskHandler, pollTriggerTaskHandler, metrics, workflowOwner, agentOwner, systemTaskOwner, eventService) {
        this.logger = logger;
        const config = globalConfig.scheduler;
        const enabled = config.enabled && instanceSettings.instanceType === 'main';
        const tracer = (0, scheduler_tracer_1.createSchedulerTracer)(tracing);
        this.scheduler = enabled
            ? (0, scheduler_1.createScheduler)({
                hostId: instanceSettings.hostId,
                materializerTransaction: buildMaterializerTransaction(dataSource, jobs, tasks),
                taskStore: tasks,
                metrics,
                materializer: {
                    windowSeconds: config.materializationWindowSeconds,
                    defaultTimezone: globalConfig.generic.timezone,
                },
                executor: {
                    leaseSeconds: config.leaseDurationSeconds,
                    lookaheadSeconds: (0, scheduler_1.pollLookaheadSeconds)(config.executorIntervalSeconds, config.jitterRatio),
                    batchSize: config.claimBatchSize,
                },
                reaper: { batchSize: config.reaperBatchSize },
                retention: {
                    retentionSeconds: config.retentionSeconds,
                    failedRetentionSeconds: config.failedRetentionSeconds,
                },
                reconciliation: config.ownerReconciliationEnabled
                    ? {
                        jobStore: jobs,
                        owners: (0, scheduled_job_owner_registry_1.createScheduledJobOwnerRegistry)(workflowOwner, agentOwner, systemTaskOwner),
                        options: {
                            settleSeconds: config.ownerSettleSeconds,
                            quarantineGraceSeconds: config.ownerQuarantineGraceSeconds,
                            batchSize: config.ownerReconciliationBatchSize,
                        },
                    }
                    : undefined,
                lifecycle: {
                    materializerIntervalSeconds: config.materializationIntervalSeconds,
                    executorIntervalSeconds: config.executorIntervalSeconds,
                    reaperIntervalSeconds: config.reaperIntervalSeconds,
                    retentionIntervalSeconds: config.retentionIntervalSeconds,
                    reconciliationIntervalSeconds: config.ownerReconciliationIntervalSeconds,
                    materializerTimeoutSeconds: config.materializationTimeoutSeconds,
                    executorTimeoutSeconds: config.executorTimeoutSeconds,
                    reaperTimeoutSeconds: config.reaperTimeoutSeconds,
                    retentionTimeoutSeconds: config.retentionTimeoutSeconds,
                    reconciliationTimeoutSeconds: config.ownerReconciliationTimeoutSeconds,
                    jitterRatio: config.jitterRatio,
                    concurrencyMode: globalConfig.database.type === 'postgresdb' ? 'concurrent' : 'sequential',
                    maxConcurrentPasses: config.maxConcurrentPasses,
                },
                now: async () => await tasks.readDbTime(),
                onHeldByConcurrencyLimit: (occurrences) => (0, system_task_overlap_reporter_1.reportSystemTaskOverlaps)(eventService, occurrences),
                onEvent: ({ level, message, context }) => logger[level](message, context),
                tracer,
            })
            : undefined;
        if (enabled) {
            warnOnMisfireGrace(logger, config);
            warnOnDrainRate(logger, config);
        }
        this.registerTaskHandler(scheduleTriggerTaskHandler.taskType, scheduleTriggerTaskHandler);
        this.registerTaskHandler(pollTriggerTaskHandler.taskType, pollTriggerTaskHandler);
    }
    isActive() {
        return this.scheduler !== undefined;
    }
    registerTaskHandler(taskType, handler) {
        if (this.scheduler === undefined) {
            this.logger.debug('Durable scheduler is inactive on this instance; task handler not registered', {
                taskType,
            });
            return;
        }
        this.scheduler.registerTaskHandler(taskType, handler);
    }
    start() {
        this.scheduler?.start();
    }
    async stop() {
        await this.scheduler?.stop();
    }
};
exports.DurableScheduler = DurableScheduler;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DurableScheduler.prototype, "stop", null);
exports.DurableScheduler = DurableScheduler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.DataSource, db_1.ScheduledJobRepository, db_1.ScheduledTaskRepository, n8n_core_1.InstanceSettings, config_1.GlobalConfig, n8n_core_1.Tracing, schedule_trigger_task_handler_1.ScheduleTriggerTaskHandler, poll_trigger_task_handler_1.PollTriggerTaskHandler, scheduler_metrics_service_1.PrometheusSchedulerMetricsService, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner, agent_scheduled_job_owner_1.AgentScheduledJobOwner, system_task_scheduled_job_owner_1.SystemTaskScheduledJobOwner, backend_services_1.EventService])
], DurableScheduler);
function warnOnMisfireGrace(logger, config) {
    const { misfireGraceSeconds, executorIntervalSeconds, materializationWindowSeconds } = config;
    if (misfireGraceSeconds <= executorIntervalSeconds) {
        logger.warn('Scheduler misfire grace is at or below the executor interval; late runs may expire before they can be claimed', { misfireGraceSeconds, executorIntervalSeconds });
    }
    if (misfireGraceSeconds < materializationWindowSeconds) {
        logger.warn('Scheduler misfire grace is below the materialization window; runs missed during a short outage are dropped rather than caught up', { misfireGraceSeconds, materializationWindowSeconds });
    }
}
function warnOnDrainRate(logger, config) {
    const { materializationIntervalSeconds } = config;
    const drainSeconds = scheduler_1.DEFAULT_MATERIALIZER_OPTIONS.maxPerJob;
    if (materializationIntervalSeconds > drainSeconds) {
        logger.warn('Scheduler materialization interval is long enough that a pass may never fully drain the busiest possible schedule; under the coalesce misfire policy such a schedule could stop producing catch-up runs entirely', { materializationIntervalSeconds });
    }
}
function buildMaterializerTransaction(dataSource, jobs, tasks) {
    return async (work) => await dataSource.transaction(async (manager) => await work({
        claimDueJobs: async (limit, lookaheadMs) => {
            const claimed = await jobs.claimDue(manager, limit, lookaheadMs);
            return claimed === undefined ? undefined : (0, scheduler_1.withOwnerKeys)(claimed);
        },
        recordOccurrences: async (occurrences) => await tasks.insertIgnoringDuplicates(manager, occurrences),
        retireSuperseded: async (superseded) => await tasks.updateToMissed(manager, superseded),
        advanceJobs: async (planned) => {
            await jobs.advanceMany(manager, planned.map(({ job, plan }) => ({
                id: job.id,
                nextRunAt: plan.nextRunAt,
                lastFiredAt: plan.lastFiredAt,
            })));
        },
    }));
}
//# sourceMappingURL=durable-scheduler.js.map