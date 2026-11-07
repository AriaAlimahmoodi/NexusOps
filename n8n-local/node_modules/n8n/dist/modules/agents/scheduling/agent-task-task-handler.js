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
exports.AgentTaskTaskHandler = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_task_service_1 = require("../agent-task.service");
const agent_task_job_1 = require("./agent-task-job");
const agent_task_job_registrar_1 = require("./agent-task-job-registrar");
let AgentTaskTaskHandler = class AgentTaskTaskHandler {
    constructor(logger, agentTaskService, registrar) {
        this.logger = logger;
        this.agentTaskService = agentTaskService;
        this.registrar = registrar;
        this.taskType = agent_task_job_1.AGENT_TASK_TASK_TYPE;
        this.logger = this.logger.scoped('scheduler');
    }
    async execute(task, report) {
        if (!(0, agent_task_job_1.isAgentTaskJobPayload)(task.payload)) {
            throw new n8n_workflow_1.UnexpectedError('Agent-task payload is missing agentId or taskId', {
                extra: { taskId: task.id, jobId: task.jobId },
            });
        }
        const { agentId, taskId } = task.payload;
        const outcome = await this.agentTaskService.startScheduledRun(agentId, taskId);
        if (outcome === 'stale') {
            this.logger.warn('Dropping occurrence of an agent task that is no longer scheduled', {
                agentId,
                taskId,
                jobId: task.jobId,
            });
            this.selfHeal(agentId);
            return report.notDispatched();
        }
        if (outcome === 'skipped-active' || outcome === 'skipped-disabled') {
            return report.notDispatched();
        }
        this.logger.debug('Handed off agent-task occurrence to a run', {
            agentId,
            taskId,
            jobId: task.jobId,
        });
        return report.dispatched();
    }
    selfHeal(agentId) {
        void this.registrar.reconcile(agentId).catch((error) => {
            this.logger.warn('Failed to reconcile an agent after a stale occurrence', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
};
exports.AgentTaskTaskHandler = AgentTaskTaskHandler;
exports.AgentTaskTaskHandler = AgentTaskTaskHandler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_task_service_1.AgentTaskService, agent_task_job_registrar_1.AgentTaskJobRegistrar])
], AgentTaskTaskHandler);
//# sourceMappingURL=agent-task-task-handler.js.map