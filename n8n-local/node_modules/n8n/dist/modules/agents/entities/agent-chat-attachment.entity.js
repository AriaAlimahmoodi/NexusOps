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
exports.AgentChatAttachment = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_entity_1 = require("./agent.entity");
let AgentChatAttachment = class AgentChatAttachment extends db_1.WithTimestampsAndStringId {
};
exports.AgentChatAttachment = AgentChatAttachment;
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentChatAttachment.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentChatAttachment.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", Object)
], AgentChatAttachment.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AgentChatAttachment.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "binaryDataId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AgentChatAttachment.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], AgentChatAttachment.prototype, "source", void 0);
exports.AgentChatAttachment = AgentChatAttachment = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_chat_attachments' }),
    (0, typeorm_1.Index)(['projectId', 'threadId']),
    (0, typeorm_1.Index)(['agentId', 'threadId'])
], AgentChatAttachment);
//# sourceMappingURL=agent-chat-attachment.entity.js.map