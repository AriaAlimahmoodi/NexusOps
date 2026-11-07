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
var AgentInterruptedExecutionSweeper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentInterruptedExecutionSweeper = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_background_job_service_1 = require("./background/agent-background-job.service");
const agent_wake_service_1 = require("./background/agent-wake.service");
const agent_execution_repository_1 = require("./repositories/agent-execution.repository");
let AgentInterruptedExecutionSweeper = AgentInterruptedExecutionSweeper_1 = class AgentInterruptedExecutionSweeper {
    constructor(logger, executionRepository, executionService, backgroundJobService, agentWakeService, agentsConfig) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.executionService = executionService;
        this.backgroundJobService = backgroundJobService;
        this.agentWakeService = agentWakeService;
        this.agentsConfig = agentsConfig;
        this.logger = this.logger.scoped('agents');
    }
    async sweep(signal) {
        let running;
        try {
            running = await this.executionRepository.findRunning();
        }
        catch (error) {
            this.logger.error('Failed to query running agent executions', { error });
            return;
        }
        const graceMs = AgentInterruptedExecutionSweeper_1.LIVENESS_GRACE_SECONDS * constants_1.Time.seconds.toMilliseconds;
        for (const execution of running) {
            if (this.stopped(signal, 'finalize'))
                return;
            try {
                if (execution.updatedAt.getTime() > Date.now() - graceMs) {
                    continue;
                }
                if (await this.executionService.finalizeInterruptedExecution(execution, new Date(Date.now() - graceMs))) {
                    this.logger.info('Marked abandoned agent execution as interrupted', {
                        executionId: execution.id,
                        threadId: execution.threadId,
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to finalize interrupted agent execution', {
                    executionId: execution.id,
                    threadId: execution.threadId,
                    error,
                });
            }
        }
        if (this.stopped(signal, 'reconcile'))
            return;
        try {
            if (this.agentsConfig.backgroundTasksEnabled) {
                await this.backgroundJobService.reconcile(signal);
            }
            else {
                await this.backgroundJobService.reconcileWorkflowJobs(signal);
            }
        }
        catch (error) {
            this.logger.error('Failed to reconcile background job rows', { error });
        }
        if (this.stopped(signal, 'drain'))
            return;
        try {
            await this.agentWakeService.drainUnconsumed();
        }
        catch (error) {
            this.logger.error('Failed to schedule delivery of pending background job results', { error });
        }
    }
    stopped(signal, before) {
        if (!signal?.aborted)
            return false;
        this.logger.debug('Stopped the interrupted execution sweep early', { before });
        return true;
    }
};
exports.AgentInterruptedExecutionSweeper = AgentInterruptedExecutionSweeper;
AgentInterruptedExecutionSweeper.LIVENESS_GRACE_SECONDS = 2 * constants_1.Time.minutes.toSeconds;
exports.AgentInterruptedExecutionSweeper = AgentInterruptedExecutionSweeper = AgentInterruptedExecutionSweeper_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_execution_repository_1.AgentExecutionRepository, agent_execution_service_1.AgentExecutionService, agent_background_job_service_1.AgentBackgroundJobService, agent_wake_service_1.AgentWakeService, config_1.AgentsConfig])
], AgentInterruptedExecutionSweeper);
//# sourceMappingURL=agent-interrupted-execution-sweeper.js.map