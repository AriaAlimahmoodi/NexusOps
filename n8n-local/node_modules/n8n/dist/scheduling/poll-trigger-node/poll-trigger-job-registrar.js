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
exports.PollTriggerJobRegistrar = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const scheduler_1 = require("@n8n/scheduler");
const n8n_core_1 = require("n8n-core");
const poll_backoff_service_1 = require("../../workflows/triggers/poll-backoff.service");
const desired_job_name_1 = require("../desired-job-name");
const durable_job_provisioner_1 = require("../durable-job-provisioner");
const seeded_cron_1 = require("../seeded-cron");
const workflow_scheduled_job_owner_1 = require("../workflow-scheduled-job-owner");
const poll_trigger_task_1 = require("./poll-trigger-task");
let PollTriggerJobRegistrar = class PollTriggerJobRegistrar extends n8n_core_1.PollJobManager {
    constructor(logger, globalConfig, jobProvisioner, pollBackoffService, owner) {
        super();
        this.logger = logger;
        this.jobProvisioner = jobProvisioner;
        this.pollBackoffService = pollBackoffService;
        this.owner = owner;
        this.defaultTimezone = globalConfig.generic.timezone;
        this.pollTimeoutSeconds = globalConfig.scheduler.pollTimeoutSeconds;
        this.logger = this.logger.scoped('scheduler');
    }
    async register(workflowId, node, pollTimes, timezone) {
        const resolvedTimezone = resolveTimezone(timezone, this.defaultTimezone);
        const seed = `${workflowId}:${node.id}`;
        const desired = this.toDesiredJobs(workflowId, node, pollTimes, seed, resolvedTimezone);
        const payload = { workflowId, nodeId: node.id };
        const summary = await this.jobProvisioner.provision({
            owner: this.owner.member(workflowId, node.id),
            taskType: poll_trigger_task_1.POLL_TRIGGER_TASK_TYPE,
            payload: { ...payload },
            desired,
            misfirePolicy: constants_1.ScheduledJobMisfirePolicy.Skip,
            timeoutSeconds: this.pollTimeoutSeconds,
        });
        this.logger.debug('Provisioned scheduler jobs for poll trigger node', {
            workflowId,
            nodeId: node.id,
            inserted: summary.inserted.length,
            redefined: summary.redefined.length,
            unchanged: summary.unchanged.length,
            removed: summary.removed.length,
        });
        const inserted = summary.inserted.length > 0;
        if (inserted) {
            await this.pollBackoffService.reset(workflowId, node.id);
        }
        return { inserted };
    }
    toDesiredJobs(workflowId, node, pollTimes, seed, timezone) {
        return (0, desired_job_name_1.nameDesiredJobs)(workflowId, node.id, pollTimes.map((item) => {
            const schedule = {
                kind: 'cron',
                cronExpression: (0, seeded_cron_1.seededCron)(item, seed),
                timezone,
            };
            return { schedule, firstRunAt: (0, scheduler_1.computeFirstRunAt)(schedule, new Date()) };
        }));
    }
    async remove(workflowId, nodeId) {
        await this.jobProvisioner.deprovisionOwnerMember(this.owner.member(workflowId, nodeId));
    }
    async removeWorkflow(workflowId) {
        await this.jobProvisioner.deprovisionOwnerTaskType(this.owner.ref(workflowId), poll_trigger_task_1.POLL_TRIGGER_TASK_TYPE);
    }
    async removeWorkflowInTransaction(manager, workflowId) {
        await this.jobProvisioner.deprovisionOwnerTaskTypeInTransaction(manager, this.owner.ref(workflowId), poll_trigger_task_1.POLL_TRIGGER_TASK_TYPE);
    }
};
exports.PollTriggerJobRegistrar = PollTriggerJobRegistrar;
exports.PollTriggerJobRegistrar = PollTriggerJobRegistrar = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, durable_job_provisioner_1.DurableJobProvisioner, poll_backoff_service_1.PollBackoffService, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner])
], PollTriggerJobRegistrar);
function resolveTimezone(timezone, defaultTimezone) {
    return !timezone || timezone === 'DEFAULT' ? defaultTimezone : timezone;
}
//# sourceMappingURL=poll-trigger-job-registrar.js.map