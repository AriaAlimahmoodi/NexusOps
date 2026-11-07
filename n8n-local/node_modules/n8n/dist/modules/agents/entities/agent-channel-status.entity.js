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
exports.AgentChannelStatus = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_entity_1 = require("./agent.entity");
let AgentChannelStatus = class AgentChannelStatus extends db_1.WithTimestamps {
};
exports.AgentChannelStatus = AgentChannelStatus;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36,
        comment: 'Agent that owns this channel',
    }),
    __metadata("design:type", String)
], AgentChannelStatus.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_entity_1.Agent, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", Object)
], AgentChannelStatus.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 64,
        comment: 'Chat integration platform for this channel',
    }),
    __metadata("design:type", String)
], AgentChannelStatus.prototype, "integrationType", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36,
        comment: 'Credential connection that backs this channel; no FK so a failure is still recordable after the credential is deleted',
    }),
    __metadata("design:type", String)
], AgentChannelStatus.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 128,
        comment: 'Process that observed this; the only writer of this row',
    }),
    __metadata("design:type", String)
], AgentChannelStatus.prototype, "hostId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        comment: 'What this process last observed: connected or error',
    }),
    __metadata("design:type", String)
], AgentChannelStatus.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: 'Why this process could not start the channel; null once it succeeds',
    }),
    __metadata("design:type", Object)
], AgentChannelStatus.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: 0,
        comment: 'Consecutive failed startup attempts by this process, reset on success',
    }),
    __metadata("design:type", Number)
], AgentChannelStatus.prototype, "attempts", void 0);
__decorate([
    (0, db_1.DateTimeColumn)({
        nullable: true,
        comment: 'Earliest this process should retry; null when there is nothing to retry',
    }),
    __metadata("design:type", Object)
], AgentChannelStatus.prototype, "backoffUntil", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, db_1.DateTimeColumn)({
        nullable: true,
        comment: 'When this row stops counting unless its owner refreshes it; null never expires',
    }),
    __metadata("design:type", Object)
], AgentChannelStatus.prototype, "expiresAt", void 0);
exports.AgentChannelStatus = AgentChannelStatus = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_channel_status' })
], AgentChannelStatus);
//# sourceMappingURL=agent-channel-status.entity.js.map