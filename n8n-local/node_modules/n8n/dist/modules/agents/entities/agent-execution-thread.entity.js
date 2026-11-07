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
exports.AgentExecutionThread = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_history_entity_1 = require("./agent-history.entity");
const agent_entity_1 = require("./agent.entity");
let AgentExecutionThread = class AgentExecutionThread extends db_1.WithTimestampsAndStringId {
};
exports.AgentExecutionThread = AgentExecutionThread;
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId', foreignKeyConstraintName: 'FK_agent_execution_threads_owner' }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, comment: 'User who started this private session' }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        default: 'user',
        comment: 'user: private session; project: shared integration, workflow, or task session',
    }),
    __metadata("design:type", String)
], AgentExecutionThread.prototype, "accessScope", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", agent_entity_1.Agent)
], AgentExecutionThread.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentExecutionThread.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentExecutionThread.prototype, "agentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8, nullable: true }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "parentThreadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "parentAgentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", db_1.Project)
], AgentExecutionThread.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentExecutionThread.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: api_types_1.AGENT_TASK_ID_MAX_LENGTH,
        nullable: true,
        comment: 'Published task ID that triggered this session; not an FK because published runs can outlive draft task definition rows',
    }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_history_entity_1.AgentHistory, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'taskVersionId' }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "taskVersion", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        nullable: true,
        comment: 'Published agent_history version that supplied the task snapshot',
    }),
    __metadata("design:type", Object)
], AgentExecutionThread.prototype, "taskVersionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentExecutionThread.prototype, "sessionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentExecutionThread.prototype, "totalPromptTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentExecutionThread.prototype, "totalCompletionTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', default: 0 }),
    __metadata("design:type", Number)
], AgentExecutionThread.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AgentExecutionThread.prototype, "totalDuration", void 0);
exports.AgentExecutionThread = AgentExecutionThread = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_execution_threads' })
], AgentExecutionThread);
//# sourceMappingURL=agent-execution-thread.entity.js.map