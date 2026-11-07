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
exports.AgentCheckpoint = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_entity_1 = require("./agent.entity");
let AgentCheckpoint = class AgentCheckpoint extends db_1.WithTimestamps {
};
exports.AgentCheckpoint = AgentCheckpoint;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentCheckpoint.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentCheckpoint.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AgentCheckpoint.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: 'SDK thread key from checkpoint state. Execution history is optional.',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], AgentCheckpoint.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentCheckpoint.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AgentCheckpoint.prototype, "expired", void 0);
exports.AgentCheckpoint = AgentCheckpoint = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_checkpoints' }),
    (0, typeorm_1.Index)('IDX_agent_checkpoints_thread', ['agentId', 'threadId', 'expired', 'updatedAt'])
], AgentCheckpoint);
//# sourceMappingURL=agent-checkpoint.entity.js.map