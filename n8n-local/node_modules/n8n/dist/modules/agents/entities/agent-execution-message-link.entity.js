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
exports.AgentExecutionMessageLink = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_execution_entity_1 = require("./agent-execution.entity");
const agent_message_entity_1 = require("./agent-message.entity");
let AgentExecutionMessageLink = class AgentExecutionMessageLink extends db_1.WithCreatedAt {
};
exports.AgentExecutionMessageLink = AgentExecutionMessageLink;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentExecutionMessageLink.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentExecutionMessageLink.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 6 }),
    __metadata("design:type", String)
], AgentExecutionMessageLink.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AgentExecutionMessageLink.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_entity_1.AgentExecution, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'executionId' }),
    __metadata("design:type", Object)
], AgentExecutionMessageLink.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_message_entity_1.AgentMessageEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'messageId' }),
    __metadata("design:type", Object)
], AgentExecutionMessageLink.prototype, "message", void 0);
exports.AgentExecutionMessageLink = AgentExecutionMessageLink = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_execution_message_links' }),
    (0, typeorm_1.Index)(['executionId', 'direction', 'position'], { unique: true }),
    (0, typeorm_1.Index)(['messageId'])
], AgentExecutionMessageLink);
//# sourceMappingURL=agent-execution-message-link.entity.js.map