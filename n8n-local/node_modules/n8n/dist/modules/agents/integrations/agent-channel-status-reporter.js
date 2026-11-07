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
exports.AgentChannelStatusReporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const scrub_secrets_1 = require("@n8n/utils/scrub-secrets");
const agent_channel_status_repository_1 = require("../repositories/agent-channel-status.repository");
const LEASE_INTERVALS = 3;
const MAX_BACKOFF_MS = 10 * constants_1.Time.minutes.toMilliseconds;
let AgentChannelStatusReporter = class AgentChannelStatusReporter {
    constructor(logger, agentsConfig, repository) {
        this.logger = logger;
        this.agentsConfig = agentsConfig;
        this.repository = repository;
        this.hasWithdrawn = false;
    }
    async recordConnected(ref) {
        await this.swallow('record a running channel', ref, async () => {
            await this.repository.saveOwn(ref, {
                status: 'connected',
                errorMessage: null,
                attempts: 0,
                backoffUntil: null,
                expiresAt: this.leaseExpiresAt(),
            });
        });
    }
    async recordFailure(ref, cause) {
        await this.swallow('record a failed channel startup', ref, async () => {
            const existing = await this.repository.findOwnChannel(ref);
            const attempts = (existing?.status === 'error' ? existing.attempts : 0) + 1;
            await this.repository.saveOwn(ref, {
                status: 'error',
                errorMessage: (0, scrub_secrets_1.scrubSecretsInText)(cause instanceof Error ? cause.message : String(cause)),
                attempts,
                backoffUntil: this.backoffUntil(attempts),
                expiresAt: this.leaseExpiresAt(),
            });
        });
    }
    async refreshLease(ref) {
        await this.swallow('refresh a channel status lease', ref, async () => {
            await this.repository.refreshOwnLease(ref, this.leaseExpiresAt());
        });
    }
    async withdraw(ref) {
        await this.swallow('withdraw a channel status', ref, async () => {
            await this.repository.clearOwnChannel(ref);
        });
    }
    async withdrawAll() {
        this.hasWithdrawn = true;
        try {
            await this.repository.clearOwnHost();
        }
        catch (error) {
            this.logger.warn(`[AgentChannelStatusReporter] Could not withdraw this instance's channel statuses on shutdown: ${this.describe(error)}`);
        }
    }
    isLive(row, now) {
        return row.expiresAt === null || row.expiresAt.getTime() > now.getTime();
    }
    isRetryReady(row, now) {
        if (!row?.backoffUntil)
            return true;
        return row.backoffUntil.getTime() <= now.getTime();
    }
    leaseExpiresAt() {
        const intervalMs = this.intervalMs();
        if (intervalMs <= 0)
            return null;
        return new Date(Date.now() + LEASE_INTERVALS * intervalMs);
    }
    backoffUntil(attempts) {
        const intervalMs = this.intervalMs() || constants_1.Time.minutes.toMilliseconds;
        const delayMs = Math.min(intervalMs * 2 ** Math.max(attempts - 1, 0), MAX_BACKOFF_MS);
        return new Date(Date.now() + delayMs);
    }
    intervalMs() {
        return this.agentsConfig.channelReconcileIntervalSeconds * constants_1.Time.seconds.toMilliseconds;
    }
    async swallow(what, ref, write) {
        if (this.hasWithdrawn) {
            this.logger.debug(`[AgentChannelStatusReporter] Not going to ${what} for ${ref.integrationType} on agent ${ref.agentId} — this instance has withdrawn`);
            return;
        }
        try {
            await write();
        }
        catch (error) {
            this.logger.warn(`[AgentChannelStatusReporter] Could not ${what} for ${ref.integrationType} on agent ${ref.agentId}: ${this.describe(error)}`);
        }
    }
    describe(error) {
        return error instanceof Error ? error.message : String(error);
    }
};
exports.AgentChannelStatusReporter = AgentChannelStatusReporter;
exports.AgentChannelStatusReporter = AgentChannelStatusReporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.AgentsConfig, agent_channel_status_repository_1.AgentChannelStatusRepository])
], AgentChannelStatusReporter);
//# sourceMappingURL=agent-channel-status-reporter.js.map