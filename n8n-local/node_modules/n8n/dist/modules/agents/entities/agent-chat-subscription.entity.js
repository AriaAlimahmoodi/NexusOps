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
exports.AgentChatSubscription = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_entity_1 = require("./agent.entity");
let AgentChatSubscription = class AgentChatSubscription extends db_1.WithTimestamps {
};
exports.AgentChatSubscription = AgentChatSubscription;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36,
        comment: 'Agent that owns this subscription',
    }),
    __metadata("design:type", String)
], AgentChatSubscription.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentChatSubscription.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 64,
        comment: 'Chat integration platform for this subscription',
    }),
    __metadata("design:type", String)
], AgentChatSubscription.prototype, "integrationType", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 255,
        comment: 'Credential connection that owns this subscription',
    }),
    __metadata("design:type", String)
], AgentChatSubscription.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 255,
        comment: 'Platform thread ID the agent is subscribed to',
    }),
    __metadata("design:type", String)
], AgentChatSubscription.prototype, "threadId", void 0);
exports.AgentChatSubscription = AgentChatSubscription = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_chat_subscriptions' })
], AgentChatSubscription);
//# sourceMappingURL=agent-chat-subscription.entity.js.map