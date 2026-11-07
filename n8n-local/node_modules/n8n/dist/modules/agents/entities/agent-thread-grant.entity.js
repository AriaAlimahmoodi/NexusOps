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
exports.AgentThreadGrant = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const agent_execution_thread_entity_1 = require("./agent-execution-thread.entity");
let AgentThreadGrant = class AgentThreadGrant extends db_1.WithTimestamps {
};
exports.AgentThreadGrant = AgentThreadGrant;
__decorate([
    (0, typeorm_1.ManyToOne)(() => agent_execution_thread_entity_1.AgentExecutionThread, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'threadId' }),
    __metadata("design:type", agent_execution_thread_entity_1.AgentExecutionThread)
], AgentThreadGrant.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], AgentThreadGrant.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 512,
        comment: 'JSON tuple: [tool, toolName] or [integration_action, connectionId, action]',
    }),
    __metadata("design:type", String)
], AgentThreadGrant.prototype, "grantKey", void 0);
exports.AgentThreadGrant = AgentThreadGrant = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_thread_grants' })
], AgentThreadGrant);
//# sourceMappingURL=agent-thread-grant.entity.js.map