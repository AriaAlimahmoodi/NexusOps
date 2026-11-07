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
exports.AgentChangePublisher = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agent_channel_1 = require("./utils/agent-channel");
let AgentChangePublisher = class AgentChangePublisher {
    constructor(publisher, globalConfig, logger) {
        this.publisher = publisher;
        this.globalConfig = globalConfig;
        this.logger = logger;
    }
    async publish(change) {
        if (!this.globalConfig.multiMainSetup.enabled)
            return;
        try {
            await this.publisher.publishCommand(change);
        }
        catch (error) {
            const { payload } = change;
            this.logger.warn(`Failed to publish ${change.command}`, {
                agentId: payload.agentId,
                ...('integration' in payload && (0, agent_channel_1.agentChannelRef)(payload.agentId, payload.integration)),
                ...('threadId' in payload && { threadId: payload.threadId }),
                ...('action' in payload && { action: payload.action }),
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.AgentChangePublisher = AgentChangePublisher;
exports.AgentChangePublisher = AgentChangePublisher = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [publisher_service_1.Publisher, config_1.GlobalConfig, backend_common_1.Logger])
], AgentChangePublisher);
//# sourceMappingURL=agent-change-publisher.service.js.map