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
exports.AgentTaskService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const crypto_1 = require("crypto");
const luxon_1 = require("luxon");
const n8n_core_1 = require("n8n-core");
const errors_1 = require("@n8n/errors");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_execution_orchestrator_service_1 = require("./agent-execution-orchestrator.service");
const agent_change_publisher_service_1 = require("./agent-change-publisher.service");
const agent_save_completion_service_1 = require("./agent-save-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agent_task_job_registrar_1 = require("./scheduling/agent-task-job-registrar");
const task_timezone_1 = require("./scheduling/task-timezone");
const agent_entity_1 = require("./entities/agent.entity");
const cron_validation_1 = require("./integrations/cron-validation");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const agent_task_run_lock_repository_1 = require("./repositories/agent-task-run-lock.repository");
const agent_task_snapshot_repository_1 = require("./repositories/agent-task-snapshot.repository");
const agent_task_repository_1 = require("./repositories/agent-task.repository");
const agent_draft_utils_1 = require("./utils/agent-draft.utils");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_resource_id_1 = require("./utils/agent-resource-id");
const TASK_RUN_LOCK_TTL_MS = 5 * 60 * 1000;
const TASK_RUN_LOCK_RENEW_MS = 60 * 1000;
const AGENT_TASK_SCHEDULE_GROUP_TYPE = 'agent-task';
const agentTaskScheduleGroup = (agentId) => ({
    type: AGENT_TASK_SCHEDULE_GROUP_TYPE,
    id: agentId,
});
let AgentTaskService = class AgentTaskService {
    constructor(logger, globalConfig, taskRepository, taskSnapshotRepository, taskRunLockRepository, agentRepository, agentExecutionOrchestratorService, instanceSettings, scheduledTaskManager, changePublisher, durableJobRegistrar, saveCompletion, settingsService, transactionRunner, agentSkillRefs) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.taskRepository = taskRepository;
        this.taskSnapshotRepository = taskSnapshotRepository;
        this.taskRunLockRepository = taskRunLockRepository;
        this.agentRepository = agentRepository;
        this.agentExecutionOrchestratorService = agentExecutionOrchestratorService;
        this.instanceSettings = instanceSettings;
        this.scheduledTaskManager = scheduledTaskManager;
        this.changePublisher = changePublisher;
        this.durableJobRegistrar = durableJobRegistrar;
        this.saveCompletion = saveCompletion;
        this.settingsService = settingsService;
        this.transactionRunner = transactionRunner;
        this.agentSkillRefs = agentSkillRefs;
    }
    async list(agentId) {
        const tasks = await this.taskRepository.findByAgentId(agentId);
        return tasks.map((task) => this.toDto(task));
    }
    async create(agentId, projectId, dto, context) {
        const { tasks } = await this.createTasksBatch(agentId, projectId, [dto], context);
        return tasks[0];
    }
    async createTasks(agentId, projectId, dtos, context) {
        const { tasks, agent, skillRefs } = await this.createTasksBatch(agentId, projectId, dtos, context);
        return { tasks, configHash: (0, agent_config_hash_1.getAgentConfigHash)((0, agent_config_composition_1.composeJsonConfig)(agent, skillRefs)) };
    }
    async createTasksBatch(agentId, projectId, dtos, context) {
        if (dtos.length === 0) {
            throw new errors_1.BadRequestError('At least one task is required');
        }
        for (const dto of dtos) {
            this.assertValidCron(dto.cronExpression);
            this.assertValidTimezone(dto.timezone);
        }
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        if (!agent.schema)
            throw new errors_1.BadRequestError('Agent has no config yet');
        const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const previous = (0, agent_modification_telemetry_service_1.captureAgentMutation)(agent, skillRefs);
        const tasks = dtos.map((dto) => {
            const taskId = (0, agent_resource_id_1.generateAgentResourceId)('task', (agent.schema?.tasks ?? []).map((ref) => ref.id));
            this.attachTaskRef(agent, taskId, dto.enabled ?? true);
            return this.taskRepository.create({
                id: taskId,
                agentId,
                name: dto.name,
                objective: dto.objective,
                cronExpression: dto.cronExpression,
                timezone: dto.timezone ?? null,
            });
        });
        (0, agent_draft_utils_1.markAgentDraftDirty)(agent);
        await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, agent, ctx);
            await this.taskRepository.saveDefinitions(tasks, ctx);
        });
        this.saveCompletion.taskSaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(agent, skillRefs, projectId, context, previous, { tasks: true }), context.pushRef);
        this.logger.debug('[AgentTaskService] Created tasks', {
            agentId,
            taskIds: tasks.map((task) => task.id),
        });
        return { tasks: tasks.map((task) => this.toDto(task)), agent, skillRefs };
    }
    async update(agentId, projectId, taskId, dto, context) {
        const { task } = await this.updateWithChange(agentId, projectId, taskId, dto, context);
        return task;
    }
    async updateWithChange(agentId, projectId, taskId, dto, context) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const task = await this.getOrThrow(agentId, taskId);
        const changed = this.applyTaskUpdates(task, dto);
        if (!changed)
            return { task: this.toDto(task), changed: false };
        const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const previous = (0, agent_modification_telemetry_service_1.captureAgentMutation)(agent, skillRefs);
        const saved = await this.transactionRunner.run({}, async (ctx) => {
            (0, agent_draft_utils_1.markAgentDraftDirty)(agent);
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, agent, ctx);
            const [savedTask] = await this.taskRepository.saveDefinitions([task], ctx);
            return savedTask;
        });
        this.saveCompletion.taskSaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(agent, skillRefs, projectId, context, previous, { tasks: true }), context.pushRef);
        return { task: this.toDto(saved), changed: true };
    }
    async delete(agentId, projectId, taskId, context) {
        await this.getOrThrow(agentId, taskId);
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const previous = (0, agent_modification_telemetry_service_1.captureAgentMutation)(agent, skillRefs);
        if (agent.schema?.tasks) {
            agent.schema.tasks = agent.schema.tasks.filter((ref) => ref.id !== taskId);
            (0, agent_draft_utils_1.markAgentDraftDirty)(agent);
        }
        await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, agent, ctx);
            await this.taskRepository.deleteForAgent(agentId, [taskId], ctx);
        });
        this.saveCompletion.taskSaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(agent, skillRefs, projectId, context, previous, { tasks: true }), context.pushRef);
        this.logger.debug('[AgentTaskService] Deleted task', { agentId, taskId });
    }
    attachTaskRef(agent, taskId, enabled) {
        if (!agent.schema)
            throw new errors_1.BadRequestError('Agent has no config yet');
        agent.schema.tasks = [
            ...(agent.schema.tasks ?? []).filter((ref) => ref.id !== taskId),
            { type: 'task', id: taskId, enabled },
        ];
    }
    async requestReconcile(agentId) {
        if (this.durableJobRegistrar.isEnabled()) {
            await this.durableJobRegistrar.reconcile(agentId);
            return;
        }
        await this.registerEnabledForAgent(agentId);
        this.broadcastTasksChanged(agentId);
    }
    async registerEnabledForAgent(agentId) {
        if (this.durableJobRegistrar.isEnabled())
            return;
        const agent = await this.agentRepository.findOne({
            where: { id: agentId },
            relations: { activeVersion: true },
        });
        if (!agent?.activeVersionId || !(0, agent_entity_1.isProjectAgent)(agent)) {
            this.deregisterAgentTasks(agentId);
            return;
        }
        await this.reconcileAgent(agent);
    }
    async handleTasksChanged(payload) {
        await this.registerEnabledForAgent(payload.agentId);
    }
    broadcastTasksChanged(agentId) {
        void this.changePublisher.publish({ command: 'agent-tasks-changed', payload: { agentId } });
    }
    deregisterAgentTasks(agentId) {
        const group = agentTaskScheduleGroup(agentId);
        const taskIds = this.scheduledTaskManager.getTargetIds(group);
        if (!this.scheduledTaskManager.deregisterGroup(group))
            return;
        for (const taskId of taskIds) {
            this.logger.info('[AgentTaskService] Deregistered task', { taskId });
        }
    }
    async reconnectAll() {
        if (this.durableJobRegistrar.isEnabled())
            return;
        const agents = (await this.agentRepository.find({
            where: { activeVersionId: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            relations: { activeVersion: true },
        })).filter(agent_entity_1.isProjectAgent);
        this.logger.debug('[AgentTaskService] Reconnecting published agents', { count: agents.length });
        for (const agent of agents) {
            try {
                await this.reconcileAgent(agent);
            }
            catch (error) {
                this.logger.error('[AgentTaskService] Failed to reconnect agent tasks', {
                    agentId: agent.id,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    stopAll() {
        this.scheduledTaskManager.deregisterGroups(AGENT_TASK_SCHEDULE_GROUP_TYPE);
    }
    async reconcileAgent(agent) {
        if (!this.instanceSettings.isLeader)
            return;
        if (!agent.activeVersionId) {
            this.deregisterAgentTasks(agent.id);
            return;
        }
        const snapshots = await this.taskSnapshotRepository.findEnabledByVersionId(agent.activeVersionId);
        const enabledIds = new Set(snapshots.map((snapshot) => snapshot.taskId));
        for (const taskId of this.scheduledTaskManager.getTargetIds(agentTaskScheduleGroup(agent.id))) {
            if (!enabledIds.has(taskId))
                this.deregister(agent.id, taskId);
        }
        if (enabledIds.size === 0)
            return;
        for (const snapshot of snapshots) {
            this.registerOrRefresh(agent.id, snapshot);
        }
    }
    registerOrRefresh(agentId, snapshot) {
        const { taskId, cronExpression } = snapshot;
        if (!(0, cron_validation_1.isValidCronExpression)(cronExpression)) {
            this.logger.warn('[AgentTaskService] Skipping task with invalid cron', { taskId });
            this.deregister(agentId, taskId);
            return;
        }
        this.deregister(agentId, taskId);
        const timezone = this.resolveTaskTimezone(snapshot.timezone, taskId);
        const registered = this.scheduledTaskManager.register({
            group: agentTaskScheduleGroup(agentId),
            targetId: taskId,
            expression: cronExpression,
            timezone,
        }, () => {
            void this.startScheduledRun(agentId, taskId).catch((error) => {
                this.logger.error('[AgentTaskService] Scheduled task lock failed', {
                    taskId,
                    agentId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        });
        if (!registered)
            return;
        this.logger.info('[AgentTaskService] Registered task', {
            taskId,
            agentId,
            cronExpression,
            timezone,
        });
    }
    deregister(agentId, taskId) {
        const group = agentTaskScheduleGroup(agentId);
        if (!this.scheduledTaskManager.hasTarget(group, taskId))
            return;
        this.scheduledTaskManager.deregisterTarget(group, taskId);
        this.logger.info('[AgentTaskService] Deregistered task', { taskId });
    }
    async startScheduledRun(agentId, taskId) {
        if (!(await this.settingsService.getEnabled()))
            return 'skipped-disabled';
        const agent = await this.agentRepository.findOne({ where: { id: agentId } });
        const snapshot = agent?.activeVersionId
            ? await this.taskSnapshotRepository.findByVersionAndTaskId(agent.activeVersionId, taskId)
            : null;
        if (!agent?.activeVersionId || !snapshot?.enabled || !(0, agent_entity_1.isProjectAgent)(agent)) {
            this.logger.warn('[AgentTaskService] Task fired but is no longer published and enabled', {
                taskId,
                agentId,
            });
            this.deregister(agentId, taskId);
            return 'stale';
        }
        const holderId = (0, crypto_1.randomUUID)();
        const lock = await this.taskRunLockRepository.acquire(agentId, taskId, {
            holderId,
            ttlMs: TASK_RUN_LOCK_TTL_MS,
        });
        if (!lock) {
            this.logger.info('[AgentTaskService] Skipping task because previous run is still active', {
                taskId,
                agentId,
            });
            return 'skipped-active';
        }
        void this.runScheduledTask(agent, snapshot, lock);
        return 'started';
    }
    startTaskRunLockRenewal(lock) {
        return setInterval(() => {
            void this.taskRunLockRepository
                .renew(lock, TASK_RUN_LOCK_TTL_MS)
                .then((renewed) => {
                if (!renewed) {
                    this.logger.warn('[AgentTaskService] Failed to renew task run lock', {
                        taskId: lock.taskId,
                        agentId: lock.agentId,
                    });
                }
            })
                .catch((error) => {
                this.logger.warn('[AgentTaskService] Failed to renew task run lock', {
                    taskId: lock.taskId,
                    agentId: lock.agentId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, TASK_RUN_LOCK_RENEW_MS);
    }
    async runTask(agent, snapshot) {
        const { id: agentId, projectId } = agent;
        const { taskId } = snapshot;
        const { message, threadId } = this.buildTaskRunMessage(taskId, snapshot.objective, snapshot.timezone);
        this.logger.info('[AgentTaskService] Task fired', {
            taskId,
            agentId,
            projectId,
            cronExpression: snapshot.cronExpression,
            timezone: snapshot.timezone,
        });
        await this.consumeTaskRun('Task run', { taskId, agentId, projectId }, this.agentExecutionOrchestratorService.executeForTaskPublished({
            agentId,
            projectId,
            message,
            memory: { threadId, resourceId: (0, agent_memory_scope_1.taskRunMemoryResourceId)(taskId) },
            taskId,
            taskVersionId: snapshot.versionId,
        }));
    }
    buildTaskRunMessage(taskId, objective, taskTimezone) {
        const timezone = this.globalConfig.generic.timezone;
        const timestamp = luxon_1.DateTime.now().setZone(timezone).toISO() ?? new Date().toISOString();
        const scheduleTimezone = this.resolveTaskTimezone(taskTimezone, taskId);
        const scheduleNote = scheduleTimezone === timezone ? '' : `\nThis task is scheduled in ${scheduleTimezone}.`;
        const message = `${objective}\n\nCurrent date and time: ${timestamp} (timezone: ${timezone})${scheduleNote}`;
        const threadId = `task-${taskId}-${(0, crypto_1.randomUUID)()}`;
        return { message, threadId };
    }
    async consumeTaskRun(kind, context, stream) {
        const startedAt = Date.now();
        try {
            let chunkCount = 0;
            for await (const _chunk of stream) {
                chunkCount += 1;
            }
            this.logger.info(`[AgentTaskService] ${kind} completed`, {
                ...context,
                chunkCount,
                durationMs: Date.now() - startedAt,
            });
        }
        catch (error) {
            this.logger.error(`[AgentTaskService] ${kind} failed`, {
                ...context,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async runNow(agentId, taskId, user) {
        const task = await this.getOrThrow(agentId, taskId);
        const agent = await this.agentRepository.findOne({ where: { id: agentId } });
        if (!agent || !(0, agent_entity_1.isProjectAgent)(agent)) {
            throw new errors_1.NotFoundError(`Agent "${agentId}" not found`);
        }
        void this.executeNow(task, agent.projectId, user);
    }
    async executeNow(task, projectId, user) {
        const { message, threadId } = this.buildTaskRunMessage(task.id, task.objective, task.timezone);
        this.logger.info('[AgentTaskService] Manual task run started', {
            taskId: task.id,
            agentId: task.agentId,
            projectId,
        });
        await this.consumeTaskRun('Manual task run', { taskId: task.id, agentId: task.agentId, projectId }, this.agentExecutionOrchestratorService.executeForTaskNow({
            agentId: task.agentId,
            projectId,
            user,
            message,
            memory: { threadId, resourceId: (0, agent_memory_scope_1.taskRunMemoryResourceId)(task.id) },
            taskId: task.id,
        }));
    }
    async getOrThrow(agentId, taskId) {
        const task = await this.taskRepository.findByIdAndAgentId(taskId, agentId);
        if (!task) {
            throw new errors_1.NotFoundError(`Task "${taskId}" not found`);
        }
        return task;
    }
    assertValidCron(cronExpression) {
        if (!(0, cron_validation_1.isValidCronExpression)(cronExpression)) {
            throw new errors_1.BadRequestError('Invalid cron expression');
        }
    }
    assertValidTimezone(timezone) {
        if (timezone === null || timezone === undefined)
            return;
        if (!(0, api_types_1.isValidTimeZone)(timezone)) {
            throw new errors_1.BadRequestError('Invalid timezone');
        }
    }
    resolveTaskTimezone(taskTimezone, taskId) {
        return ((0, task_timezone_1.knownTaskTimezone)(taskTimezone, taskId, this.logger) ?? this.globalConfig.generic.timezone);
    }
    toDto(task) {
        return {
            id: task.id,
            name: task.name,
            objective: task.objective,
            cronExpression: task.cronExpression,
            timezone: task.timezone,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        };
    }
    applyTaskUpdates(task, dto) {
        let changed = false;
        if (dto.cronExpression !== undefined) {
            this.assertValidCron(dto.cronExpression);
            if (dto.cronExpression !== task.cronExpression) {
                task.cronExpression = dto.cronExpression;
                changed = true;
            }
        }
        if (dto.timezone !== undefined) {
            this.assertValidTimezone(dto.timezone);
            const timezone = dto.timezone ?? null;
            if (timezone !== task.timezone) {
                task.timezone = timezone;
                changed = true;
            }
        }
        if (dto.name !== undefined && dto.name !== task.name) {
            task.name = dto.name;
            changed = true;
        }
        if (dto.objective !== undefined && dto.objective !== task.objective) {
            task.objective = dto.objective;
            changed = true;
        }
        return changed;
    }
    async runScheduledTask(agent, snapshot, lock) {
        const agentId = agent.id;
        const taskId = snapshot.taskId;
        const renewInterval = this.startTaskRunLockRenewal(lock);
        try {
            await this.runTask(agent, snapshot);
        }
        catch (error) {
            this.logger.error('[AgentTaskService] Scheduled task run failed', {
                taskId,
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            clearInterval(renewInterval);
            await this.taskRunLockRepository.release(lock).catch((error) => {
                this.logger.warn('[AgentTaskService] Failed to release task run lock', {
                    taskId,
                    agentId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }
    }
};
exports.AgentTaskService = AgentTaskService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-tasks-changed', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentTaskService.prototype, "handleTasksChanged", null);
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentTaskService.prototype, "reconnectAll", null);
__decorate([
    (0, decorators_1.OnLeaderStepdown)(),
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentTaskService.prototype, "stopAll", null);
exports.AgentTaskService = AgentTaskService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, agent_task_repository_1.AgentTaskRepository, agent_task_snapshot_repository_1.AgentTaskSnapshotRepository, agent_task_run_lock_repository_1.AgentTaskRunLockRepository, agent_repository_1.AgentRepository, agent_execution_orchestrator_service_1.AgentExecutionOrchestratorService, n8n_core_1.InstanceSettings, n8n_core_1.ScheduledTaskManager, agent_change_publisher_service_1.AgentChangePublisher, agent_task_job_registrar_1.AgentTaskJobRegistrar, agent_save_completion_service_1.AgentSaveCompletionService, agents_settings_service_1.AgentsSettingsService, db_1.TransactionRunner, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentTaskService);
//# sourceMappingURL=agent-task.service.js.map