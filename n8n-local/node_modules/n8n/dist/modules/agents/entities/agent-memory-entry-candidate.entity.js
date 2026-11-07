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
exports.AgentMemoryEntryCandidateEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentMemoryEntryCandidateEntity = class AgentMemoryEntryCandidateEntity extends db_1.WithTimestampsAndStringId {
};
exports.AgentMemoryEntryCandidateEntity = AgentMemoryEntryCandidateEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntryCandidateEntity.prototype, "sourceMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "toolCallId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "evidenceText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'pending' }),
    __metadata("design:type", String)
], AgentMemoryEntryCandidateEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 0 }),
    __metadata("design:type", Number)
], AgentMemoryEntryCandidateEntity.prototype, "attemptCount", void 0);
exports.AgentMemoryEntryCandidateEntity = AgentMemoryEntryCandidateEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_memory_entry_candidates' }),
    (0, typeorm_1.Index)(['agentId', 'runId', 'toolCallId'], { unique: true }),
    (0, typeorm_1.Index)(['agentId', 'resourceId', 'status', 'createdAt', 'id']),
    (0, typeorm_1.Index)(['resourceId']),
    (0, typeorm_1.Index)(['threadId']),
    (0, typeorm_1.Index)(['sourceMessageId'])
], AgentMemoryEntryCandidateEntity);
//# sourceMappingURL=agent-memory-entry-candidate.entity.js.map