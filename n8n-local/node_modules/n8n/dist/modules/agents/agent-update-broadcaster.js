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
exports.AgentUpdateBroadcaster = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const push_1 = require("../../push");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agent_push_recipients_service_1 = require("./agent-push-recipients.service");
let AgentUpdateBroadcaster = class AgentUpdateBroadcaster {
    constructor(logger, recipients, push, publisher, instanceSettings) {
        this.logger = logger;
        this.recipients = recipients;
        this.push = push;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.logger = this.logger.scoped('agents');
    }
    notify(data, excludePushRef) {
        void this.broadcast(data, excludePushRef).catch((error) => {
            this.logger.warn('Failed to broadcast agent update', {
                agentId: data.agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    async broadcast(data, excludePushRef) {
        const userIds = await this.recipients.getProjectReaders(data.projectId);
        if (userIds.length === 0)
            return;
        this.push.sendToUsers({ type: 'agentUpdated', data }, userIds, { excludePushRef });
        if (this.instanceSettings.isWorker || this.instanceSettings.isMultiMain) {
            await this.publisher.publishCommand({
                command: 'relay-agent-update',
                payload: { data, userIds, excludePushRef },
            });
        }
    }
    handleRelay({ data, userIds, excludePushRef }) {
        this.push.sendToUsers({ type: 'agentUpdated', data }, userIds, { excludePushRef });
    }
};
exports.AgentUpdateBroadcaster = AgentUpdateBroadcaster;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-agent-update', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentUpdateBroadcaster.prototype, "handleRelay", null);
exports.AgentUpdateBroadcaster = AgentUpdateBroadcaster = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_push_recipients_service_1.AgentPushRecipientsService, push_1.Push, publisher_service_1.Publisher, n8n_core_1.InstanceSettings])
], AgentUpdateBroadcaster);
//# sourceMappingURL=agent-update-broadcaster.js.map