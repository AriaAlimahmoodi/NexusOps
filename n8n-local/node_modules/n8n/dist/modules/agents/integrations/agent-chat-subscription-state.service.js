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
exports.AgentChatSubscriptionStateService = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const agent_chat_subscription_state_adapter_1 = require("./agent-chat-subscription-state.adapter");
const agent_change_publisher_service_1 = require("../agent-change-publisher.service");
const agent_chat_subscription_repository_1 = require("../repositories/agent-chat-subscription.repository");
const agent_channel_1 = require("../utils/agent-channel");
let AgentChatSubscriptionStateService = class AgentChatSubscriptionStateService {
    constructor(repository, changePublisher) {
        this.repository = repository;
        this.changePublisher = changePublisher;
        this.activeStates = new Map();
    }
    createStateAdapter(options) {
        const scope = (0, agent_channel_1.agentChannelRef)(options.agentId, options.integration);
        const state = new agent_chat_subscription_state_adapter_1.AgentChatSubscriptionStateAdapter(scope, options.integration, options.delegate, this.repository, async (integration, threadId, action) => await this.changePublisher.publish({
            command: 'agent-chat-subscription-changed',
            payload: { agentId: options.agentId, integration, threadId, action },
        }), (disconnectedState) => this.unregister(disconnectedState));
        this.activeStates.set(state.key, state);
        return state;
    }
    async deleteSubscriptionsForIntegration(agentId, integration) {
        await this.repository.deleteForConnection((0, agent_channel_1.agentChannelRef)(agentId, integration));
    }
    async handleSubscriptionChanged(payload) {
        const state = this.activeStates.get((0, agent_channel_1.agentChannelKey)((0, agent_channel_1.agentChannelRef)(payload.agentId, payload.integration)));
        await state?.applyRemoteChange(payload.threadId, payload.action);
    }
    unregister(state) {
        if (this.activeStates.get(state.key) === state) {
            this.activeStates.delete(state.key);
        }
    }
};
exports.AgentChatSubscriptionStateService = AgentChatSubscriptionStateService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('agent-chat-subscription-changed', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentChatSubscriptionStateService.prototype, "handleSubscriptionChanged", null);
exports.AgentChatSubscriptionStateService = AgentChatSubscriptionStateService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_chat_subscription_repository_1.AgentChatSubscriptionRepository, agent_change_publisher_service_1.AgentChangePublisher])
], AgentChatSubscriptionStateService);
//# sourceMappingURL=agent-chat-subscription-state.service.js.map