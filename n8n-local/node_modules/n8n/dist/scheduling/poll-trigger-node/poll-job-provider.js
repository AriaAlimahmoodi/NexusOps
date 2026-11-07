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
exports.PollJobProvider = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const durable_poller_chain_1 = require("./durable-poller-chain");
const poll_trigger_job_registrar_1 = require("./poll-trigger-job-registrar");
let PollJobProvider = class PollJobProvider {
    constructor(logger, globalConfig, workflowsConfig, pollTriggerJobRegistrar) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.workflowsConfig = workflowsConfig;
        this.pollTriggerJobRegistrar = pollTriggerJobRegistrar;
        this.logger = this.logger.scoped('scheduler');
    }
    init() {
        const active = (0, durable_poller_chain_1.isDurablePollerChainEnabled)(this.globalConfig.scheduler, this.workflowsConfig);
        if (this.globalConfig.scheduler.enabled &&
            !this.workflowsConfig.useWorkflowPublicationService) {
            this.logger.warn('N8N_SCHEDULER_ENABLED is set but the workflow publication service is disabled. The durable scheduler cannot take over poll triggers, which keep using the legacy in-memory engine.');
        }
        di_1.Container.set(n8n_core_1.PollJobManager, active ? this.pollTriggerJobRegistrar : new n8n_core_1.NoOpPollJobManager());
    }
};
exports.PollJobProvider = PollJobProvider;
exports.PollJobProvider = PollJobProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, config_1.WorkflowsConfig, poll_trigger_job_registrar_1.PollTriggerJobRegistrar])
], PollJobProvider);
//# sourceMappingURL=poll-job-provider.js.map