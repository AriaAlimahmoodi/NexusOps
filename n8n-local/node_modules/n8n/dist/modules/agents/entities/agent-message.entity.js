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
exports.AgentMessageEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_thread_entity_1 = require("./agent-thread.entity");
let AgentMessageEntity = class AgentMessageEntity extends db_1.WithTimestampsAndStringId {
};
exports.AgentMessageEntity = AgentMessageEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMessageEntity.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMessageEntity.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMessageEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "type", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "content", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "author", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "origin", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "modelContent", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentMessageEntity.prototype, "modelContextAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_thread_entity_1.AgentThreadEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", agent_thread_entity_1.AgentThreadEntity)
], AgentMessageEntity.prototype, "thread", void 0);
exports.AgentMessageEntity = AgentMessageEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_messages' }),
    (0, typeorm_1.Index)(['resourceId', 'threadId']),
    (0, typeorm_1.Index)('IDX_agents_messages_model_context', { synchronize: false })
], AgentMessageEntity);
//# sourceMappingURL=agent-message.entity.js.map