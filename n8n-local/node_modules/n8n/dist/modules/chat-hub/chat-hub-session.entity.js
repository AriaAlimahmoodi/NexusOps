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
exports.ChatHubSession = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let ChatHubSession = class ChatHubSession extends db_1.WithTimestamps {
};
exports.ChatHubSession = ChatHubSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatHubSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 256 }),
    __metadata("design:type", String)
], ChatHubSession.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String }),
    __metadata("design:type", String)
], ChatHubSession.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('User', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "owner", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], ChatHubSession.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CredentialsEntity', { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'credentialId' }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "credential", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 256, nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('WorkflowEntity', { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('ChatHubAgent', { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'production' }),
    __metadata("design:type", String)
], ChatHubSession.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ChatHubMessage', 'session'),
    __metadata("design:type", Array)
], ChatHubSession.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)('ChatHubTool'),
    (0, typeorm_1.JoinTable)({
        name: 'chat_hub_session_tools',
        joinColumn: { name: 'sessionId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'toolId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Object)
], ChatHubSession.prototype, "tools", void 0);
exports.ChatHubSession = ChatHubSession = __decorate([
    (0, typeorm_1.Entity)({ name: 'chat_hub_sessions' })
], ChatHubSession);
//# sourceMappingURL=chat-hub-session.entity.js.map