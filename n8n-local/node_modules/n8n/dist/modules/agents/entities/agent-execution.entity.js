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
exports.AgentExecution = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_execution_thread_entity_1 = require("./agent-execution-thread.entity");
let AgentExecution = class AgentExecution extends db_1.WithTimestampsAndStringId {
};
exports.AgentExecution = AgentExecution;
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_thread_entity_1.AgentExecutionThread, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", agent_execution_thread_entity_1.AgentExecutionThread)
], AgentExecution.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentExecution.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentExecution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: 'Accept input until the runtime closes admission',
    }),
    __metadata("design:type", Boolean)
], AgentExecution.prototype, "acceptsSteering", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "startedAt", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({ precision: 3, nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "stoppedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentExecution.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "userMessage", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "author", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "promptTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "completionTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "totalTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "cost", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "timeline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "error", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "failureSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "hitlStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], AgentExecution.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, nullable: false, default: 'db' }),
    __metadata("design:type", String)
], AgentExecution.prototype, "storedAt", void 0);
exports.AgentExecution = AgentExecution = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_execution' }),
    (0, typeorm_1.Index)(['threadId', 'createdAt']),
    (0, typeorm_1.Index)(['status'], { where: '"status" = \'running\'' })
], AgentExecution);
//# sourceMappingURL=agent-execution.entity.js.map