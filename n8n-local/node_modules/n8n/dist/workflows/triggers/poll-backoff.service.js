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
exports.PollBackoffService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const durable_poller_chain_1 = require("../../scheduling/poll-trigger-node/durable-poller-chain");
const poll_backoff_policy_1 = require("../../workflows/triggers/poll-backoff-policy");
let PollBackoffService = class PollBackoffService {
    constructor(pollerStateRepository, schedulerConfig, workflowsConfig, logger, errorReporter) {
        this.pollerStateRepository = pollerStateRepository;
        this.schedulerConfig = schedulerConfig;
        this.workflowsConfig = workflowsConfig;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.logger = this.logger.scoped('poll-trigger');
    }
    get enabled() {
        return (this.schedulerConfig.durableCursorsEnabled &&
            (0, durable_poller_chain_1.isDurablePollerChainEnabled)(this.schedulerConfig, this.workflowsConfig));
    }
    async getState(workflowId, nodeId) {
        if (!this.enabled)
            return null;
        try {
            return await this.pollerStateRepository.findState(workflowId, nodeId);
        }
        catch (error) {
            this.reportFailure(error, workflowId, nodeId, 'Failed to read poller state');
            return null;
        }
    }
    isBackingOff(state, now) {
        if (state === null || !(state.backoffUntil instanceof Date))
            return false;
        const untilMs = state.backoffUntil.getTime();
        if (!Number.isFinite(untilMs))
            return false;
        const nowMs = now.getTime();
        if (untilMs <= nowMs)
            return false;
        if (untilMs - nowMs > poll_backoff_policy_1.RETRY_AFTER_MAX_MS)
            return false;
        return true;
    }
    async recordFailure(args) {
        const { workflowId, nodeId, error, state, now } = args;
        if (!this.enabled)
            return;
        const consecutiveErrors = (state?.consecutiveErrors ?? 0) + 1;
        try {
            const { type, retryAfterMs, cause } = (0, poll_backoff_policy_1.pollFailureFromError)(error, now);
            const delayMs = (0, poll_backoff_policy_1.computeBackoffDelayMs)({ type, consecutiveErrors, retryAfterMs });
            const updated = await this.pollerStateRepository.recordFailure(workflowId, nodeId, delayMs);
            if (!updated) {
                this.logger.debug('Poller state row missing while recording a poll failure', {
                    workflowId,
                    nodeId,
                });
            }
            else {
                this.logger.warn('Poll failed; backing off', {
                    workflowId,
                    nodeId,
                    type,
                    cause,
                    consecutiveErrors,
                    delayMs,
                });
            }
        }
        catch (writeError) {
            this.reportFailure(writeError, workflowId, nodeId, 'Failed to record poll failure');
        }
    }
    async recordSuccess(args) {
        const { workflowId, nodeId, state } = args;
        if (state === null || state.consecutiveErrors > 0 || state.backoffUntil !== null) {
            await this.reset(workflowId, nodeId);
        }
    }
    async reset(workflowId, nodeId) {
        if (!this.enabled)
            return;
        try {
            await this.pollerStateRepository.clearFailures(workflowId, nodeId);
        }
        catch (error) {
            this.reportFailure(error, workflowId, nodeId, 'Failed to clear poller failure state');
        }
    }
    reportFailure(error, workflowId, nodeId, message) {
        try {
            this.logger.error(message, { workflowId, nodeId, error });
        }
        catch {
        }
        try {
            this.errorReporter.error(error, { extra: { workflowId, nodeId } });
        }
        catch {
        }
    }
};
exports.PollBackoffService = PollBackoffService;
exports.PollBackoffService = PollBackoffService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.PollerStateRepository, config_1.SchedulerConfig, config_1.WorkflowsConfig, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], PollBackoffService);
//# sourceMappingURL=poll-backoff.service.js.map