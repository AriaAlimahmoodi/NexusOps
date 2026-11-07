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
exports.DurableJobProvisioner = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const agent_scheduled_job_owner_1 = require("./agent-scheduled-job-owner");
const schedule_columns_1 = require("./schedule-columns");
const scheduled_job_owner_registry_1 = require("./scheduled-job-owner-registry");
const scheduler_tracer_1 = require("./scheduler-tracer");
const system_task_scheduled_job_owner_1 = require("./system-tasks/system-task-scheduled-job-owner");
const workflow_scheduled_job_owner_1 = require("./workflow-scheduled-job-owner");
let DurableJobProvisioner = class DurableJobProvisioner {
    constructor(logger, dataSource, jobs, tasks, globalConfig, workflowOwner, agentOwner, systemTaskOwner, tracing) {
        this.logger = logger;
        this.dataSource = dataSource;
        this.jobs = jobs;
        this.tasks = tasks;
        this.globalConfig = globalConfig;
        this.logger = this.logger.scoped('scheduler');
        this.provisioner = (0, scheduler_1.createJobProvisioner)({
            provisionTransaction: (scope) => this.provisionTransaction(scope),
            deprovisionTransaction: (scope) => this.deprovisionTransaction(scope),
            owners: (0, scheduled_job_owner_registry_1.createScheduledJobOwnerRegistry)(workflowOwner, agentOwner, systemTaskOwner),
            tracer: (0, scheduler_tracer_1.createSchedulerTracer)(tracing),
            materializer: {
                windowSeconds: globalConfig.scheduler.materializationWindowSeconds,
                defaultTimezone: globalConfig.generic.timezone,
            },
            seedHooks: {
                onPlanError: (job, error) => this.logger.error('Failed to plan a scheduled job while seeding its first run', {
                    jobId: job.id,
                    error: (0, ensure_error_1.ensureError)(error).message,
                }),
                onSkippedDuplicates: (context) => this.logger.debug('Seeding skipped occurrences already recorded for a scheduled job', {
                    ...context,
                }),
            },
        });
    }
    async provision({ desired, ...scope }) {
        return await this.provisioner.provision(scope, desired);
    }
    async deprovisionOwnerMember(owner) {
        return await this.provisioner.deprovision({ scope: 'member', owner });
    }
    async deprovisionOwner(owner) {
        return await this.provisioner.deprovision({ scope: 'owner', owner });
    }
    async deprovisionOwnerTaskType(owner, taskType) {
        return await this.provisioner.deprovision({ scope: 'task-type', owner, taskType });
    }
    async deprovisionUnchangedJob(job) {
        return await this.provisioner.deprovision({ scope: 'job', job });
    }
    async deprovisionOwnerInTransaction(manager, owner) {
        await this.jobs.deleteByOwnerRef(manager, owner);
    }
    async deprovisionOwnerTaskTypeInTransaction(manager, owner, taskType) {
        await this.jobs.deleteByOwnerTaskType(manager, owner, taskType);
    }
    provisionTransaction({ owner, taskType, payload, ...requested }) {
        const runOptions = this.resolveRunOptions(requested, owner);
        return async (work) => await this.dataSource.transaction(async (manager) => {
            const revived = await this.jobs.liftQuarantineByOwner(manager, owner);
            if (revived > 0) {
                this.logger.info('Lifted the quarantine on scheduled jobs while provisioning them', {
                    ...owner,
                    jobs: revived,
                });
            }
            const existingRows = await this.jobs.findManyByOwner(manager, owner);
            const outdated = (0, scheduler_1.findOutdatedJobs)(existingRows, runOptions, payload);
            await this.jobs.updateRunOptions(manager, outdated.runOptions, runOptions);
            await this.jobs.updatePayload(manager, outdated.payload, payload);
            await this.tasks.updateMissedAfterForJobs(manager, outdated.misfireGrace, runOptions.misfireGraceSeconds);
            await this.tasks.updateTimeoutForPendingJobs(manager, outdated.timeout, runOptions.timeoutSeconds);
            return await work({
                findExisting: async () => existingRows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    schedule: (0, schedule_columns_1.rowSchedule)(row),
                    hasClock: row.nextRunAt !== null,
                })),
                insert: async (desired) => {
                    const rows = desired.map((job) => ({
                        name: job.name,
                        ...owner,
                        taskType,
                        payload,
                        ...(0, schedule_columns_1.scheduleColumns)(job.schedule),
                        nextRunAt: job.firstRunAt,
                        ...runOptions,
                    }));
                    return await this.jobs.insertMany(manager, rows);
                },
                redefine: async (jobId, schedule, nextRunAt) => {
                    await this.jobs.updateDefinition(manager, jobId, {
                        ...(0, schedule_columns_1.scheduleColumns)(schedule),
                        nextRunAt,
                        ...runOptions,
                    });
                },
                withdrawPendingTasks: async (jobIds) => await this.tasks.deletePendingByJobIds(manager, jobIds),
                deleteJobs: async (jobIds) => await this.jobs.deleteManyByIds(manager, jobIds),
                readJobs: async (jobIds) => {
                    const now = await this.tasks.readDbTime(manager);
                    const jobs = await this.jobs.findManyByIds(manager, jobIds);
                    return (0, scheduler_1.withOwnerKeys)({ now, jobs });
                },
                recordOccurrences: async (occurrences) => await this.tasks.insertIgnoringDuplicates(manager, occurrences),
                retireSuperseded: async (superseded) => await this.tasks.updateToMissed(manager, superseded),
                advanceJobs: async (planned) => await this.jobs.advanceMany(manager, planned.map(({ job, plan }) => ({
                    id: job.id,
                    nextRunAt: plan.nextRunAt,
                    lastFiredAt: plan.lastFiredAt,
                }))),
            });
        });
    }
    resolveRunOptions(requested, owner) {
        const { scheduler } = this.globalConfig;
        let resolved;
        try {
            resolved = (0, scheduler_1.resolveCoreRunOptions)(requested, {
                maxAttempts: scheduler.maxAttempts,
                timeoutSeconds: scheduler.taskTimeoutSeconds,
                misfireGraceSeconds: scheduler.misfireGraceSeconds,
                executorIntervalSeconds: scheduler.executorIntervalSeconds,
                materializationWindowSeconds: scheduler.materializationWindowSeconds,
            });
        }
        catch (error) {
            if (error instanceof scheduler_1.InvalidRunOptionError) {
                throw new n8n_workflow_1.UserError(error.message, {
                    cause: error,
                    extra: { option: error.option, value: error.value, max: error.max },
                });
            }
            throw error;
        }
        const { runOptions, misfireGraceAdjustment } = resolved;
        if (misfireGraceAdjustment) {
            this.logger.warn(misfireGraceAdjustment.direction === 'raised'
                ? "Raised a node's misfire grace to the scheduler's minimum"
                : "Lowered a node's misfire grace to the scheduler's maximum", {
                ...owner,
                requestedMisfireGraceSeconds: misfireGraceAdjustment.requestedMisfireGraceSeconds,
                misfireGraceSeconds: runOptions.misfireGraceSeconds,
            });
        }
        return runOptions;
    }
    deprovisionTransaction(scope) {
        return async (work) => await this.dataSource.transaction(async (manager) => await work({
            deleteAll: async () => await this.deleteScope(manager, scope),
        }));
    }
    async deleteScope(manager, target) {
        switch (target.scope) {
            case 'member':
                return await this.jobs.deleteByOwnerMember(manager, target.owner);
            case 'owner':
                return await this.jobs.deleteByOwnerRef(manager, target.owner);
            case 'task-type':
                return await this.jobs.deleteByOwnerTaskType(manager, target.owner, target.taskType);
            case 'job':
                return await this.jobs.deleteIfPayloadUnchanged(manager, target.job.id, target.job.payload);
        }
    }
};
exports.DurableJobProvisioner = DurableJobProvisioner;
exports.DurableJobProvisioner = DurableJobProvisioner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.DataSource, db_1.ScheduledJobRepository, db_1.ScheduledTaskRepository, config_1.GlobalConfig, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner, agent_scheduled_job_owner_1.AgentScheduledJobOwner, system_task_scheduled_job_owner_1.SystemTaskScheduledJobOwner, n8n_core_1.Tracing])
], DurableJobProvisioner);
//# sourceMappingURL=durable-job-provisioner.js.map