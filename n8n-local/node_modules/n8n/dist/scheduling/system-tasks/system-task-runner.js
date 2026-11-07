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
exports.SystemTaskRunner = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const durable_scheduler_1 = require("../durable-scheduler");
const emit_system_task_metric_1 = require("./emit-system-task-metric");
const system_task_handler_1 = require("./system-task-handler");
const system_task_job_registrar_1 = require("./system-task-job-registrar");
const system_task_scheduled_job_owner_1 = require("./system-task-scheduled-job-owner");
const in_memory_system_task_runner_1 = require("./in-memory-system-task-runner");
const system_task_type_1 = require("./system-task-type");
let SystemTaskRunner = class SystemTaskRunner {
    constructor(logger, metadata, durableScheduler, jobRegistrar, systemTaskOwner, globalConfig, instanceSettings, errorReporter, eventService, tracing) {
        this.metadata = metadata;
        this.durableScheduler = durableScheduler;
        this.jobRegistrar = jobRegistrar;
        this.systemTaskOwner = systemTaskOwner;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.errorReporter = errorReporter;
        this.eventService = eventService;
        this.tracing = tracing;
        this.registeredNames = new Set();
        this.durableTasks = [];
        this.initialized = false;
        this.isShuttingDown = false;
        this.shutdownController = new AbortController();
        this.logger = logger.scoped('system-tasks');
        this.leaderTaskRunner = this.createLeaderTaskRunner();
        this.instanceTaskRunner = this.createInstanceTaskRunner();
    }
    createLeaderTaskRunner() {
        return new in_memory_system_task_runner_1.InMemorySystemTaskRunner('leader_timer', this.logger, this.eventService, this.tracing, this.globalConfig.generic.timezone, {
            reportFailure: this.reportFailure.bind(this),
            onStart: () => (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-timers-started', {}),
            onStop: () => (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-timers-stopped', {}),
        });
    }
    createInstanceTaskRunner() {
        return new in_memory_system_task_runner_1.InMemorySystemTaskRunner('instance_timer', this.logger, this.eventService, this.tracing, this.globalConfig.generic.timezone, { reportFailure: this.reportFailure.bind(this) });
    }
    async init() {
        if (this.initialized) {
            return;
        }
        const isMain = this.instanceSettings.instanceType === 'main';
        if (isMain) {
            (0, node_assert_1.strict)(this.instanceSettings.instanceRole !== 'unset', 'Instance role is not set');
        }
        this.initialized = true;
        this.instanceTaskRunner.start(new Date());
        this.metadata.subscribe((taskClass) => this.route(taskClass));
        if (isMain) {
            if (this.instanceSettings.isLeader) {
                this.startLeaderTimers();
            }
            for (const durableTask of this.durableTasks) {
                await this.jobRegistrar.provision(durableTask);
            }
            await this.jobRegistrar.removeStale();
        }
    }
    startLeaderTimers() {
        if (this.initialized && !this.isShuttingDown) {
            this.leaderTaskRunner.start(new Date());
        }
    }
    async stopLeaderTimers() {
        await this.leaderTaskRunner.stop();
    }
    async shutdown() {
        this.isShuttingDown = true;
        this.shutdownController.abort();
        await Promise.all([this.leaderTaskRunner.stop(), this.instanceTaskRunner.stop()]);
    }
    route(taskClass) {
        const task = di_1.Container.get(taskClass);
        if (this.registeredNames.has(task.name)) {
            throw new n8n_workflow_1.UnexpectedError('A system task name is registered more than once', {
                extra: { name: task.name },
            });
        }
        this.registeredNames.add(task.name);
        const { schedule, runOptions } = (0, decorators_1.resolveSystemTask)(task);
        const { target } = task;
        if (!runsOnInstanceType(target, this.instanceSettings.instanceType)) {
            this.logger.debug('System task does not run on this kind of instance', {
                name: task.name,
                target,
            });
            return;
        }
        if (target.scope === 'instance') {
            this.logger.debug('System task will run on a per-instance timer', {
                name: task.name,
                schedule,
            });
            this.instanceTaskRunner.add(task, schedule);
        }
        else if (runOptions !== undefined && this.schedulerEnabled()) {
            this.handOverToDurableScheduler({ task, schedule, runOptions });
        }
        else {
            this.logger.debug('System task will run on an in-memory timer', {
                name: task.name,
                schedule,
            });
            const { leaderTimer } = target;
            this.leaderTaskRunner.add(task, schedule, {
                runOnStart: leaderTimer?.runOnTakeover,
                retryDelaySeconds: leaderTimer?.retryDelaySeconds,
                shouldSkipRun: runOptions !== undefined
                    ? async () => await this.isProvisionedElsewhere(task)
                    : undefined,
            });
        }
    }
    handOverToDurableScheduler(durableTask) {
        const { task, schedule } = durableTask;
        this.durableTasks.push(durableTask);
        this.systemTaskOwner.declareDurable(task.name);
        this.durableScheduler.registerTaskHandler((0, system_task_type_1.systemTaskType)(task.name), new system_task_handler_1.SystemTaskHandler(task, this.shutdownController.signal, this.logger, this.eventService, this.tracing, (error) => this.reportFailure('A durable system task run failed', task, error)));
        this.logger.debug('System task will run on the durable scheduler', { name: task.name });
        (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-routed', {
            name: task.name,
            mode: 'durable',
            intervalSeconds: schedule.kind === 'interval' ? schedule.intervalSeconds : undefined,
        });
    }
    async isProvisionedElsewhere(task) {
        const provisioned = await this.jobRegistrar.isProvisioned(task.name);
        if (provisioned) {
            this.logger.debug('Skipped an in-memory system task run, its durable job is provisioned', {
                name: task.name,
            });
            (0, emit_system_task_metric_1.emitSystemTaskMetric)(this.eventService, 'system-task-run-skipped', {
                name: task.name,
                reason: 'provisioned_elsewhere',
            });
        }
        return provisioned;
    }
    schedulerEnabled() {
        return this.globalConfig.scheduler.enabledForSystemTasks && this.durableScheduler.isActive();
    }
    reportFailure(message, task, error) {
        this.logger.error(message, { name: task.name, error });
        this.errorReporter.error(error, {
            extra: { systemTask: task.name },
            shouldBeLogged: false,
            shouldIsolate: true,
        });
    }
};
exports.SystemTaskRunner = SystemTaskRunner;
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemTaskRunner.prototype, "startLeaderTimers", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemTaskRunner.prototype, "stopLeaderTimers", null);
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemTaskRunner.prototype, "shutdown", null);
exports.SystemTaskRunner = SystemTaskRunner = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, decorators_1.SystemTaskMetadata, durable_scheduler_1.DurableScheduler, system_task_job_registrar_1.SystemTaskJobRegistrar, system_task_scheduled_job_owner_1.SystemTaskScheduledJobOwner, config_1.GlobalConfig, n8n_core_1.InstanceSettings, n8n_core_1.ErrorReporter, backend_services_1.EventService, n8n_core_1.Tracing])
], SystemTaskRunner);
function runsOnInstanceType(target, instanceType) {
    return target.scope === 'cluster'
        ? instanceType === 'main'
        : target.instanceTypes.includes(instanceType);
}
//# sourceMappingURL=system-task-runner.js.map