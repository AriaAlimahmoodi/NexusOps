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
exports.AgentChatSubscriptionRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_chat_subscription_entity_1 = require("../entities/agent-chat-subscription.entity");
let AgentChatSubscriptionRepository = class AgentChatSubscriptionRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(agent_chat_subscription_entity_1.AgentChatSubscription, dataSource.manager);
    }
    async subscribe(scope, threadId) {
        await this.createQueryBuilder()
            .insert()
            .into(agent_chat_subscription_entity_1.AgentChatSubscription)
            .values({ ...scope, threadId })
            .orIgnore()
            .execute();
    }
    async unsubscribe(scope, threadId) {
        await this.delete({ ...scope, threadId });
    }
    async deleteForConnection(scope) {
        await this.delete(scope);
    }
    async isSubscribed(scope, threadId) {
        return await this.existsBy({ ...scope, threadId });
    }
    async listThreadIdsForConnection(scope) {
        const rows = await this.find({
            select: { threadId: true },
            where: scope,
            order: { createdAt: 'ASC' },
        });
        return rows.map((row) => row.threadId);
    }
};
exports.AgentChatSubscriptionRepository = AgentChatSubscriptionRepository;
exports.AgentChatSubscriptionRepository = AgentChatSubscriptionRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AgentChatSubscriptionRepository);
//# sourceMappingURL=agent-chat-subscription.repository.js.map