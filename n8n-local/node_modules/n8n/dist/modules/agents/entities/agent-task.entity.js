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
exports.AgentTask = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_entity_1 = require("./agent.entity");
let AgentTask = class AgentTask extends db_1.WithTimestamps {
};
exports.AgentTask = AgentTask;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: api_types_1.AGENT_TASK_ID_MAX_LENGTH,
        comment: 'Application-generated task ID referenced from agent JSON config',
    }),
    __metadata("design:type", String)
], AgentTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        comment: 'Owning agent; task bodies are deleted when the agent is deleted',
    }),
    __metadata("design:type", String)
], AgentTask.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentTask.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentTask.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: 'User-authored instruction sent to the agent when this task runs',
    }),
    __metadata("design:type", String)
], AgentTask.prototype, "objective", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: api_types_1.AGENT_TASK_CRON_EXPRESSION_MAX_LENGTH,
        comment: 'Cron schedule evaluated in the timezone of this task',
    }),
    __metadata("design:type", String)
], AgentTask.prototype, "cronExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        nullable: true,
        comment: 'IANA timezone the cron is evaluated in; null falls back to the instance timezone',
    }),
    __metadata("design:type", Object)
], AgentTask.prototype, "timezone", void 0);
exports.AgentTask = AgentTask = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_task_definition' })
], AgentTask);
//# sourceMappingURL=agent-task.entity.js.map