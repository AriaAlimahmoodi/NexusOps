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
exports.AgentTaskSnapshot = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_history_entity_1 = require("./agent-history.entity");
let AgentTaskSnapshot = class AgentTaskSnapshot extends db_1.WithTimestamps {
};
exports.AgentTaskSnapshot = AgentTaskSnapshot;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36,
        comment: 'Published agent_history version this task snapshot belongs to',
    }),
    __metadata("design:type", String)
], AgentTaskSnapshot.prototype, "versionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_history_entity_1.AgentHistory, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'versionId' }),
    __metadata("design:type", Object)
], AgentTaskSnapshot.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: api_types_1.AGENT_TASK_ID_MAX_LENGTH,
        comment: 'Stable task ID referenced from the published agent JSON config',
    }),
    __metadata("design:type", String)
], AgentTaskSnapshot.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        comment: 'Published enabled state for this task at publish time',
    }),
    __metadata("design:type", Boolean)
], AgentTaskSnapshot.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentTaskSnapshot.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: 'User-authored instruction sent to the agent when this task runs',
    }),
    __metadata("design:type", String)
], AgentTaskSnapshot.prototype, "objective", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: api_types_1.AGENT_TASK_CRON_EXPRESSION_MAX_LENGTH,
        comment: 'Cron schedule evaluated in the timezone of this task',
    }),
    __metadata("design:type", String)
], AgentTaskSnapshot.prototype, "cronExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        nullable: true,
        comment: 'IANA timezone the cron is evaluated in; null falls back to the instance timezone',
    }),
    __metadata("design:type", Object)
], AgentTaskSnapshot.prototype, "timezone", void 0);
exports.AgentTaskSnapshot = AgentTaskSnapshot = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_task_snapshot' })
], AgentTaskSnapshot);
//# sourceMappingURL=agent-task-snapshot.entity.js.map