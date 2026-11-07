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
exports.ScheduleTriggerJobRegistrar = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const n8n_workflow_1 = require("n8n-workflow");
const desired_job_name_1 = require("../desired-job-name");
const durable_job_provisioner_1 = require("../durable-job-provisioner");
const seeded_cron_1 = require("../seeded-cron");
const workflow_scheduled_job_owner_1 = require("../workflow-scheduled-job-owner");
const schedule_trigger_task_1 = require("./schedule-trigger-task");
let ScheduleTriggerJobRegistrar = class ScheduleTriggerJobRegistrar {
    constructor(logger, globalConfig, workflowsConfig, jobProvisioner, owner) {
        this.logger = logger;
        this.jobProvisioner = jobProvisioner;
        this.owner = owner;
        this.intercepting =
            globalConfig.scheduler.enabled && workflowsConfig.useWorkflowPublicationService;
        this.defaultTimezone = globalConfig.generic.timezone;
        this.triggerNodeMode = globalConfig.scheduler.triggerNodeMode;
        this.logger = this.logger.scoped('scheduler');
        if (globalConfig.scheduler.enabled && !workflowsConfig.useWorkflowPublicationService) {
            this.logger.warn('N8N_SCHEDULER_ENABLED is set but the workflow publication service is disabled. The durable scheduler cannot take over schedule and cron triggers, which keep using the legacy in-memory engine.');
        }
    }
    interceptsNode(node) {
        if (!this.intercepting ||
            (node.type !== n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE && node.type !== n8n_workflow_1.CRON_NODE_TYPE)) {
            return false;
        }
        return true;
    }
    createSession() {
        const pending = new Map();
        return {
            createCollector: (workflow, node) => {
                const timezone = explicitTimezone(workflow);
                const collected = [];
                const customCronExpressions = new Set();
                pending.set(pendingKey(workflow.id, node.id), {
                    misfirePolicy: resolveMisfirePolicy(node),
                    misfireGraceSeconds: resolveMisfireGraceSeconds(node, workflow.id, this.logger),
                    rules: collected,
                });
                return {
                    registerCron: ({ expression, recurrence, source, triggerTime }) => {
                        const isCustomCron = node.type === n8n_workflow_1.CRON_NODE_TYPE && triggerTime?.mode === 'custom';
                        if (isCustomCron && customCronExpressions.has(expression)) {
                            return;
                        }
                        const cronExpression = node.type === n8n_workflow_1.CRON_NODE_TYPE && triggerTime
                            ? (0, seeded_cron_1.seededCron)(triggerTime, `${workflow.id}:${node.id}`)
                            : expression;
                        const schedule = this.toSchedule(cronExpression, timezone, recurrence, source);
                        if (isDegenerateRecurrence(recurrence)) {
                            (0, scheduler_1.validateSchedule)(schedule);
                            this.logger.warn('Schedule trigger rule has a non-positive recurrence interval; it will never fire', { workflowId: workflow.id, nodeId: node.id });
                            collected.push({ schedule, firstRunAt: null });
                        }
                        else {
                            const seedSchedule = this.triggerNodeMode === 'legacy' && schedule.kind === 'interval'
                                ? { kind: 'cron', cronExpression, timezone }
                                : schedule;
                            const computed = (0, scheduler_1.computeFirstRunAt)(withResolvedTimezone(seedSchedule, this.defaultTimezone), new Date());
                            collected.push({ schedule, firstRunAt: computed });
                        }
                        if (isCustomCron) {
                            customCronExpressions.add(expression);
                        }
                    },
                };
            },
            commit: async (workflowId, nodeId) => {
                const key = pendingKey(workflowId, nodeId);
                const entry = pending.get(key);
                if (entry !== undefined) {
                    pending.delete(key);
                    await this.provisionCollected(workflowId, nodeId, entry.rules, entry.misfirePolicy, entry.misfireGraceSeconds);
                }
            },
            discard: (workflowId, nodeId) => {
                pending.delete(pendingKey(workflowId, nodeId));
            },
        };
    }
    toSchedule(expression, timezone, recurrence, source) {
        const isGatedMinutes = source?.field === 'minutes' && recurrence?.activated === true;
        if ((this.triggerNodeMode === 'new' || isGatedMinutes) &&
            source?.size !== undefined &&
            (source.field === 'seconds' || source.field === 'minutes')) {
            const intervalSeconds = source.field === 'minutes' ? source.size * 60 : source.size;
            return { kind: 'interval', intervalSeconds };
        }
        if (recurrence?.activated &&
            recurrence.typeInterval !== 'minutes' &&
            recurrence.intervalSize >= 2) {
            return {
                kind: 'recurring_cron',
                cronExpression: expression,
                timezone,
                recurrenceUnit: recurrence.typeInterval,
                recurrenceSize: recurrence.intervalSize,
            };
        }
        return { kind: 'cron', cronExpression: expression, timezone };
    }
    async provisionCollected(workflowId, nodeId, collected, misfirePolicy, misfireGraceSeconds) {
        const desired = (0, desired_job_name_1.nameDesiredJobs)(workflowId, nodeId, collected);
        const payload = { workflowId, nodeId };
        const summary = await this.jobProvisioner.provision({
            owner: this.owner.member(workflowId, nodeId),
            taskType: schedule_trigger_task_1.SCHEDULE_TRIGGER_TASK_TYPE,
            payload: { ...payload },
            desired,
            misfirePolicy,
            misfireGraceSeconds,
        });
        this.logger.debug('Provisioned durable schedules for trigger node', {
            workflowId,
            nodeId,
            inserted: summary.inserted.length,
            redefined: summary.redefined.length,
            unchanged: summary.unchanged.length,
            removed: summary.removed.length,
        });
    }
    async remove(workflowId, nodeId) {
        await this.jobProvisioner.deprovisionOwnerMember(this.owner.member(workflowId, nodeId));
    }
    async removeWorkflow(workflowId) {
        await this.jobProvisioner.deprovisionOwnerTaskType(this.owner.ref(workflowId), schedule_trigger_task_1.SCHEDULE_TRIGGER_TASK_TYPE);
    }
    async removeWorkflowInTransaction(manager, workflowId) {
        await this.jobProvisioner.deprovisionOwnerTaskTypeInTransaction(manager, this.owner.ref(workflowId), schedule_trigger_task_1.SCHEDULE_TRIGGER_TASK_TYPE);
    }
};
exports.ScheduleTriggerJobRegistrar = ScheduleTriggerJobRegistrar;
exports.ScheduleTriggerJobRegistrar = ScheduleTriggerJobRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, config_1.WorkflowsConfig, durable_job_provisioner_1.DurableJobProvisioner, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner])
], ScheduleTriggerJobRegistrar);
const pendingKey = (workflowId, nodeId) => `${workflowId}:${nodeId}`;
function explicitTimezone(workflow) {
    const timezone = workflow.settings?.timezone;
    return typeof timezone === 'string' && timezone !== '' && timezone !== 'DEFAULT'
        ? timezone
        : null;
}
function isDegenerateRecurrence(recurrence) {
    return recurrence?.activated === true && !recurrence.intervalSize;
}
function withResolvedTimezone(schedule, defaultTimezone) {
    if (schedule.kind === 'cron' || schedule.kind === 'recurring_cron') {
        return { ...schedule, timezone: schedule.timezone ?? defaultTimezone };
    }
    return schedule;
}
function resolveMisfirePolicy(node) {
    switch (node.parameters?.misfirePolicy) {
        case 'coalesce':
            return constants_1.ScheduledJobMisfirePolicy.Coalesce;
        case 'coalesce_owner':
            return constants_1.ScheduledJobMisfirePolicy.CoalesceOwner;
        default:
            return constants_1.ScheduledJobMisfirePolicy.Skip;
    }
}
function resolveMisfireGraceSeconds(node, workflowId, logger) {
    const requested = node.parameters?.misfireGraceSeconds;
    const isNumberLike = typeof requested === 'number' || typeof requested === 'string';
    const numeric = isNumberLike ? Number(requested) : Number.NaN;
    const stated = Number.isFinite(numeric) && numeric >= 1 ? numeric : undefined;
    const isBlank = typeof requested === 'string' && requested.trim() === '';
    const inherits = requested === undefined ||
        requested === null ||
        requested === false ||
        (numeric === 0 && !isBlank);
    if (stated === undefined && !inherits) {
        logger.warn('Schedule trigger node has an unusable misfire grace period; the instance setting applies', { workflowId, nodeId: node.id });
    }
    return stated;
}
//# sourceMappingURL=schedule-trigger-job-registrar.js.map