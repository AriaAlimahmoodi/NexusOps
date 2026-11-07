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
exports.ChatHubAgent = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let ChatHubAgent = class ChatHubAgent extends db_1.WithTimestamps {
};
exports.ChatHubAgent = ChatHubAgent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], ChatHubAgent.prototype, "description", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], ChatHubAgent.prototype, "icon", void 0);
__decorate([
    (0, db_1.JsonColumn)({ default: '[]' }),
    __metadata("design:type", Array)
], ChatHubAgent.prototype, "suggestedPrompts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "systemPrompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", db_1.User)
], ChatHubAgent.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ChatHubAgent.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CredentialsEntity', { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'credentialId' }),
    __metadata("design:type", Object)
], ChatHubAgent.prototype, "credential", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ChatHubAgent.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)('ChatHubTool'),
    (0, typeorm_1.JoinTable)({
        name: 'chat_hub_agent_tools',
        joinColumn: { name: 'agentId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'toolId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Object)
], ChatHubAgent.prototype, "tools", void 0);
__decorate([
    (0, db_1.JsonColumn)({ default: '[]' }),
    __metadata("design:type", Array)
], ChatHubAgent.prototype, "files", void 0);
exports.ChatHubAgent = ChatHubAgent = __decorate([
    (0, typeorm_1.Entity)({ name: 'chat_hub_agents' })
], ChatHubAgent);
//# sourceMappingURL=chat-hub-agent.entity.js.map