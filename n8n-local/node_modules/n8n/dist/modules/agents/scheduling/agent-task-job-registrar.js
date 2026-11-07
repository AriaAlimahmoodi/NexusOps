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
exports.AgentTaskJobRegistrar = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const agent_scheduled_job_owner_1 = require("../../../scheduling/agent-scheduled-job-owner");
const durable_job_provisioner_1 = require("../../../scheduling/durable-job-provisioner");
const agent_task_job_1 = require("./agent-task-job");
const task_timezone_1 = require("./task-timezone");
const cron_validation_1 = require("../integrations/cron-validation");
const agent_task_snapshot_repository_1 = require("../repositories/agent-task-snapshot.repository");
const agent_repository_1 = require("../repositories/agent.repository");
const MAX_RECONCILE_PASSES = 5;
let AgentTaskJobRegistrar = class AgentTaskJobRegistrar {
    constructor(logger, globalConfig, agentRepository, taskSnapshotRepository, scheduledJobRepository, provisioner, owner) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.agentRepository = agentRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.scheduledJobRepository = scheduledJobRepository;
        this.provisioner = provisioner;
        this.owner = owner;
        this.logger = this.logger.scoped('scheduler');
    }
    isEnabled() {
        const { enabled, enabledForAgentTasks } = this.globalConfig.scheduler;
        return enabled && enabledForAgentTasks;
    }
    async reconcile(agentId) {
        let versionId = await this.agentRepository.findActiveVersionId(agentId);
        for (let pass = 1; pass <= MAX_RECONCILE_PASSES; pass++) {
            await this.applyVersion(agentId, versionId);
            const current = await this.agentRepository.findActiveVersionId(agentId);
            if (current === versionId)
                return;
            versionId = current;
        }
        this.logger.warn('Reconcile gave up, the active version changed on every pass', {
            agentId,
            passes: MAX_RECONCILE_PASSES,
        });
    }
    async applyVersion(agentId, versionId) {
        const snapshots = versionId
            ? await this.taskSnapshotRepository.findEnabledByVersionId(versionId)
            : [];
        const keptTaskIds = new Set();
        for (const snapshot of snapshots) {
            const desired = this.desiredJobFor(agentId, snapshot);
            const payload = { agentId, taskId: snapshot.taskId };
            await this.provisioner.provision({
                owner: this.owner.member(agentId, snapshot.taskId),
                taskType: agent_task_job_1.AGENT_TASK_TASK_TYPE,
                payload: { ...payload },
                desired: desired ? [desired] : [],
                misfirePolicy: constants_1.ScheduledJobMisfirePolicy.Skip,
            });
            keptTaskIds.add(snapshot.taskId);
        }
        const memberIds = await this.scheduledJobRepository.findOwnerMemberIds(this.owner.ref(agentId), agent_task_job_1.AGENT_TASK_TASK_TYPE);
        for (const taskId of memberIds) {
            if (keptTaskIds.has(taskId))
                continue;
            await this.provisioner.deprovisionOwnerMember(this.owner.member(agentId, taskId));
        }
    }
    async reconcileAll() {
        if (!this.globalConfig.scheduler.enabled)
            return;
        if (!this.isEnabled()) {
            await this.deprovisionAllAgents();
            return;
        }
        const agentIds = await this.agentRepository.findPublishedAgentIds();
        this.logger.debug('Reconciling durable jobs of published agents', { count: agentIds.length });
        for (const agentId of agentIds) {
            try {
                await this.reconcile(agentId);
            }
            catch (error) {
                this.logger.error('Failed to reconcile an agent’s durable jobs', {
                    agentId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    async deprovisionAllAgents() {
        const pageSize = this.globalConfig.scheduler.ownerReconciliationBatchSize;
        let after;
        let removed = 0;
        for (;;) {
            const agentIds = await this.scheduledJobRepository.findOwnerIds(this.owner.ownerType, new Date(), pageSize, after);
            if (agentIds.length === 0)
                break;
            for (const agentId of agentIds) {
                const result = await this.provisioner.deprovisionOwnerTaskType(this.owner.ref(agentId), agent_task_job_1.AGENT_TASK_TASK_TYPE);
                removed += result.removed;
            }
            after = agentIds[agentIds.length - 1];
        }
        if (removed > 0) {
            this.logger.info('Removed durable agent-task jobs because the feature is off', { removed });
        }
    }
    desiredJobFor(agentId, snapshot) {
        const { taskId, cronExpression } = snapshot;
        if (!(0, cron_validation_1.isValidCronExpression)(cronExpression)) {
            this.logger.warn('Skipping task with invalid cron', { taskId, agentId });
            return null;
        }
        const timezone = (0, task_timezone_1.knownTaskTimezone)(snapshot.timezone, taskId, this.logger);
        const schedule = { kind: 'cron', cronExpression, timezone };
        try {
            const firstRunAt = (0, scheduler_1.computeFirstRunAt)({ ...schedule, timezone: timezone ?? this.globalConfig.generic.timezone }, new Date());
            return { name: (0, agent_task_job_1.agentTaskJobName)(agentId, taskId), schedule, firstRunAt };
        }
        catch (error) {
            this.logger.warn('Skipping task whose schedule cannot be planned', {
                taskId,
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
};
exports.AgentTaskJobRegistrar = AgentTaskJobRegistrar;
exports.AgentTaskJobRegistrar = AgentTaskJobRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, agent_repository_1.AgentRepository, agent_task_snapshot_repository_1.AgentTaskSnapshotRepository, db_1.ScheduledJobRepository, durable_job_provisioner_1.DurableJobProvisioner, agent_scheduled_job_owner_1.AgentScheduledJobOwner])
], AgentTaskJobRegistrar);
//# sourceMappingURL=agent-task-job-registrar.js.map