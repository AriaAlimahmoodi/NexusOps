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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiMainSetup = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_assert_1 = __importDefault(require("node:assert"));
const leader_election_client_1 = require("../scaling/leader-election-client");
let MultiMainSetup = class MultiMainSetup extends backend_common_1.TypedEmitter {
    get hostId() {
        return this.instanceSettings.hostId;
    }
    constructor(logger, instanceSettings, globalConfig, metadata, errorReporter, client) {
        super();
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.globalConfig = globalConfig;
        this.metadata = metadata;
        this.errorReporter = errorReporter;
        this.client = client;
        this.leaderCheckInProgress = false;
        this.logger = this.logger.scoped(['scaling', 'multi-main-setup']);
    }
    async init() {
        const result = await this.client.setLeaderIfNotExists();
        if (!result.ok) {
            this.logRedisCommandFailure('Failed to set leader key in Redis during init', result.error);
            this.instanceSettings.markAsFollower();
        }
        else if (result.result) {
            this.takeOverAsLeader();
        }
        else {
            this.instanceSettings.markAsFollower();
        }
        this.leaderCheckInterval = setInterval(async () => {
            await this.checkLeader();
        }, this.globalConfig.multiMainSetup.interval * constants_1.Time.seconds.toMilliseconds);
    }
    async shutdown() {
        clearInterval(this.leaderCheckInterval);
        if (this.instanceSettings.isLeader) {
            const result = await this.client.clearLeader();
            if (!result.ok) {
                this.logger.warn('Failed to clear leader key from Redis', { error: result.error });
            }
        }
        this.client.destroy();
    }
    async fetchLeaderKey() {
        const result = await this.client.getLeader();
        return result.ok ? result.result : null;
    }
    registerEventHandlers() {
        this.metadata.subscribe((handler) => this.attachHandler(handler));
    }
    attachHandler({ eventHandlerClass, methodName, eventName }) {
        this.on(eventName, async () => {
            const instance = di_1.Container.get(eventHandlerClass);
            return await instance[methodName].call(instance);
        });
    }
    async checkLeader() {
        if (this.leaderCheckInProgress) {
            this.logger.warn('Previous leader check is still in progress, skipping this check');
            return;
        }
        this.leaderCheckInProgress = true;
        try {
            if (this.instanceSettings.isLeader) {
                await this.checkAreWeStillLeader();
            }
            else {
                await this.checkCanBecomeLeader();
            }
        }
        finally {
            this.leaderCheckInProgress = false;
        }
    }
    async checkAreWeStillLeader() {
        (0, node_assert_1.default)(this.instanceSettings.isLeader);
        const renewTtlResult = await this.client.tryRenewLeaderTtl();
        if (!renewTtlResult.ok) {
            this.logRedisCommandFailure('Failed to renew leader TTL', renewTtlResult.error);
            return;
        }
        const renewalResult = renewTtlResult.result;
        if (renewalResult.id === 'success') {
            this.logger.debug(`[Instance ID ${this.hostId}] Leader is this instance`);
            return;
        }
        this.logger.warn('[Multi-main setup] Leader failed to renew leader key');
        if (renewalResult.id === 'other-host-is-leader') {
            this.logger.debug(`[Instance ID ${this.hostId}] Leader is other instance "${renewalResult.currentLeaderId}"`);
            this.stepDownToFollower();
            return;
        }
        (0, node_assert_1.default)(renewalResult.id === 'key-missing');
        const result = await this.client.setLeaderIfNotExists();
        if (!result.ok) {
            this.logRedisCommandFailure('Failed to set leader key in Redis', result.error);
            this.stepDownToFollower();
            return;
        }
        if (!result.result) {
            this.stepDownToFollower();
        }
    }
    async checkCanBecomeLeader() {
        (0, node_assert_1.default)(!this.instanceSettings.isLeader);
        const getResult = await this.client.getLeader();
        if (!getResult.ok) {
            this.logRedisCommandFailure('Failed to get leader key from Redis', getResult.error);
            return;
        }
        const leaderId = getResult.result;
        if (leaderId && leaderId === this.hostId) {
            this.errorReporter.info(`[Instance ID ${this.hostId}] Remote/Local leadership mismatch, marking self as leader`, {
                shouldBeLogged: true,
                shouldReport: true,
            });
            this.takeOverAsLeader();
            return;
        }
        if (leaderId) {
            this.logger.debug(`[Instance ID ${this.hostId}] Leader is other instance "${leaderId}"`);
            return;
        }
        this.logger.debug(`[Instance ID ${this.hostId}] Leadership vacant, attempting to become leader...`);
        const result = await this.client.setLeaderIfNotExists();
        if (!result.ok) {
            this.logger.warn('Failed to try leader key set in Redis', { error: result.error });
            return;
        }
        if (result.result) {
            this.takeOverAsLeader();
        }
    }
    takeOverAsLeader() {
        (0, node_assert_1.default)(!this.instanceSettings.isLeader);
        this.logger.info(`[Instance ID ${this.hostId}] Leader is now this instance`);
        this.instanceSettings.markAsLeader();
        this.emit('leader-takeover');
    }
    stepDownToFollower() {
        (0, node_assert_1.default)(this.instanceSettings.isLeader);
        this.logger.info(`[Instance ID ${this.hostId}] This is now a follower instance`);
        this.instanceSettings.markAsFollower();
        this.emit('leader-stepdown');
    }
    logRedisCommandFailure(message, error) {
        this.logger.warn(`${message}: ${error.message}`, { error });
    }
};
exports.MultiMainSetup = MultiMainSetup;
exports.MultiMainSetup = MultiMainSetup = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.InstanceSettings, config_1.GlobalConfig, decorators_1.MultiMainMetadata, n8n_core_1.ErrorReporter, leader_election_client_1.LeaderElectionClient])
], MultiMainSetup);
//# sourceMappingURL=multi-main-setup.ee.js.map