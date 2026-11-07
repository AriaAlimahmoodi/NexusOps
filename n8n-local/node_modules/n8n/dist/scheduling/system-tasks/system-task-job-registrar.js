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
exports.SystemTaskJobRegistrar = void 0;
exports.durableSystemTask = durableSystemTask;
exports.systemTaskProvisionRequest = systemTaskProvisionRequest;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const durable_job_provisioner_1 = require("../durable-job-provisioner");
const emit_system_task_metric_1 = require("./emit-system-task-metric");
const system_task_scheduled_job_owner_1 = require("./system-task-scheduled-job-owner");
const system_task_type_1 = require("./system-task-type");
const system_task_version_stamp_1 = require("./system-task-version-stamp");
function durableSystemTask(task) {
    const { schedule, runOptions } = (0, decorators_1.resolveSystemTask)(task);
    if (runOptions === undefined) {
        throw new n8n_workflow_1.UnexpectedError('A system task does not run on the durable scheduler', {
            extra: { name: task.name },
        });
    }
    return { task, schedule, runOptions };
}
function systemTaskProvisionRequest({ task, schedule, runOptions }, systemTaskOwner, defaultTimezone, now) {
    const firstRunAt = schedule.kind === 'interval'
        ? now
        : (0, scheduler_1.computeFirstRunAt)((0, scheduler_1.scheduleFromDefinition)(schedule, defaultTimezone), now);
    const name = (0, system_task_type_1.systemTaskType)(task.name);
    const { misfirePolicy, misfireGraceSeconds, maxAttempts, concurrencyLimit, timeoutSeconds } = runOptions;
    return {
        owner: systemTaskOwner.owner(task.name),
        taskType: name,
        payload: (0, system_task_version_stamp_1.versionStamp)(),
        desired: [{ name, schedule, firstRunAt }],
        misfirePolicy,
        misfireGraceSeconds,
        maxAttempts,
        concurrencyLimit,
        timeoutSeconds,
    };
}
let SystemTaskJobRegistrar = class SystemTaskJobRegistrar {
    constructor(logger, scheduledJobRepository, durableJobProvisioner, systemTaskOwner, globalConfig, errorReporter, eventService) {
        this.scheduledJobRepository = scheduledJobRepository;
        this.durableJobProvisioner = durableJobProvisioner;
        this.systemTaskOwner = systemTaskOwner;
        this.globalConfig = globalConfig;
        this.errorReporter = errorReporter;
        this.eventService = eventService;
        this.logger = logger.scoped('system-tasks');
    }
    async provision(durableTask) {
        const { task } = durableTask;
        try {
            const summary = await this.durableJobProvisioner.provision(systemTaskProvisionRequest(durableTask, this.systemTaskOwner, this.globalConfig.generic.timezone, new Date()));
            this.logger.debug('Provisioned the durable job of a system task', {
                name: task.name,
                inserted: summary.inserted.length,
                redefined: summary.redefined.length,
                unchanged: summary.unchanged.length,
                removed: summary.removed.length,
            });
        }
        catch (error) {
            this.reportFailure('Could not provision a durable system task, so it will not run', task.name, error);
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-scheduling-failed', {
                name: task.name,
                mode: 'durable',
            });
        }
    }
    async removeStale() {
        const stale = await this.findStale().catch((error) => {
            this.logger.error('Could not list the durable system task jobs, so stale ones stay', {
                error,
            });
            this.errorReporter.error(error, { shouldBeLogged: false, shouldIsolate: true });
            return [];
        });
        for (const job of stale) {
            await this.remove(job);
        }
    }
    async remove({ id, ownerId: name, payload }) {
        try {
            const { removed } = await this.durableJobProvisioner.deprovisionUnchangedJob({ id, payload });
            if (removed > 0) {
                this.logger.info('Removed the stale durable job of a system task', { name });
            }
            else {
                this.logger.debug('Found no durable job to remove for a stale system task', { name });
            }
        }
        catch (error) {
            this.reportFailure('Could not remove the stale durable job of a system task', name, error);
        }
    }
    async isProvisioned(taskName) {
        try {
            return await this.scheduledJobRepository.existsRunnableByOwner(this.systemTaskOwner.owner(taskName));
        }
        catch (error) {
            this.logger.warn('Could not check for the durable job of a system task, so it runs', {
                name: taskName,
                error,
            });
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-provision-check-failed', {
                name: taskName,
            });
            return false;
        }
    }
    async findStale() {
        const rows = await this.scheduledJobRepository.findPayloadsByOwnerType(this.systemTaskOwner.ownerType);
        return rows.filter(({ ownerId, payload }) => !this.systemTaskOwner.isAlive(ownerId, payload));
    }
    reportFailure(message, name, error) {
        this.logger.error(message, { name, error });
        this.errorReporter.error(error, {
            extra: { systemTask: name },
            shouldBeLogged: false,
            shouldIsolate: true,
        });
    }
};
exports.SystemTaskJobRegistrar = SystemTaskJobRegistrar;
exports.SystemTaskJobRegistrar = SystemTaskJobRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ScheduledJobRepository, durable_job_provisioner_1.DurableJobProvisioner, system_task_scheduled_job_owner_1.SystemTaskScheduledJobOwner, config_1.GlobalConfig, n8n_core_1.ErrorReporter, backend_services_1.EventService])
], SystemTaskJobRegistrar);
//# sourceMappingURL=system-task-job-registrar.js.map