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
exports.LeaderChannelRelayService = exports.LEADER_CHANNEL_REQUEST_TIMEOUT_MS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const nanoid_1 = require("nanoid");
const errors_1 = require("@n8n/errors");
const publisher_service_1 = require("../../../scaling/pubsub/publisher.service");
exports.LEADER_CHANNEL_REQUEST_TIMEOUT_MS = 20_000;
let LeaderChannelRelayService = class LeaderChannelRelayService {
    constructor(logger, publisher, instanceSettings) {
        this.logger = logger;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.pending = new Map();
    }
    async request(input) {
        const requestId = `lch_${(0, nanoid_1.nanoid)()}`;
        const label = this.describe(input);
        return await new Promise((resolve, reject) => {
            const settle = (action) => {
                clearTimeout(timer);
                this.pending.delete(requestId);
                action();
            };
            const timer = setTimeout(() => {
                settle(() => {
                    reject(new errors_1.ServiceUnavailableError(`The leader instance did not acknowledge the request to ${label} within ${exports.LEADER_CHANNEL_REQUEST_TIMEOUT_MS}ms`));
                });
            }, exports.LEADER_CHANNEL_REQUEST_TIMEOUT_MS);
            this.pending.set(requestId, {
                resolve: () => settle(resolve),
                reject: (error) => settle(() => reject(error)),
                label,
            });
            this.publish(input, requestId).catch((error) => {
                settle(() => reject(new errors_1.ServiceUnavailableError(`Could not reach the leader instance to ${label}: ${error instanceof Error ? error.message : String(error)}`)));
            });
        });
    }
    async requestWithoutAck(input) {
        await this.publish(input, `lch_${(0, nanoid_1.nanoid)()}`);
    }
    async respond(request, error) {
        try {
            await this.publisher.publishCommand({
                command: 'agent-chat-leader-channel-result',
                payload: error
                    ? { requestId: request.requestId, ok: false, error: error.message }
                    : { requestId: request.requestId, ok: true },
                targets: [request.replyTo],
            });
        }
        catch (publishError) {
            this.logger.warn(`[LeaderChannelRelayService] Could not acknowledge request ${request.requestId}: ${publishError instanceof Error ? publishError.message : String(publishError)}`);
        }
    }
    handleResult(payload) {
        const pending = this.pending.get(payload.requestId);
        if (!pending)
            return;
        if (payload.ok) {
            pending.resolve();
            return;
        }
        pending.reject(new errors_1.ServiceUnavailableError(`The leader instance could not ${pending.label}: ${payload.error ?? 'unknown error'}`));
    }
    rejectPendingOnTakeover() {
        this.rejectPending('leadership changed while the request was in flight');
    }
    rejectPendingOnShutdown() {
        this.rejectPending('this instance is shutting down');
    }
    rejectPending(reason) {
        for (const pending of [...this.pending.values()]) {
            pending.reject(new errors_1.ServiceUnavailableError(`Could not ${pending.label} — ${reason}`));
        }
    }
    async publish(input, requestId) {
        await this.publisher.publishCommand({
            command: 'agent-chat-leader-channel-request',
            payload: { ...input, requestId, replyTo: this.instanceSettings.hostId },
        });
    }
    describe(input) {
        return `${input.action} ${input.integration.type} for agent ${input.agentId}`;
    }
};
exports.LeaderChannelRelayService = LeaderChannelRelayService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-chat-leader-channel-result', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaderChannelRelayService.prototype, "handleResult", null);
__decorate([
    (0, decorators_1.OnLeaderTakeover)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaderChannelRelayService.prototype, "rejectPendingOnTakeover", null);
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaderChannelRelayService.prototype, "rejectPendingOnShutdown", null);
exports.LeaderChannelRelayService = LeaderChannelRelayService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, publisher_service_1.Publisher, n8n_core_1.InstanceSettings])
], LeaderChannelRelayService);
//# sourceMappingURL=leader-channel-relay.service.js.map