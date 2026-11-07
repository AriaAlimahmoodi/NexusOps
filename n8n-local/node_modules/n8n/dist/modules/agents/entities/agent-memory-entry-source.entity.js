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
exports.AgentMemoryEntrySourceEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentMemoryEntrySourceEntity = class AgentMemoryEntrySourceEntity extends db_1.WithTimestampsAndStringId {
};
exports.AgentMemoryEntrySourceEntity = AgentMemoryEntrySourceEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMemoryEntrySourceEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMemoryEntrySourceEntity.prototype, "memoryEntryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntrySourceEntity.prototype, "observationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntrySourceEntity.prototype, "candidateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntrySourceEntity.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AgentMemoryEntrySourceEntity.prototype, "evidenceHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentMemoryEntrySourceEntity.prototype, "evidenceText", void 0);
exports.AgentMemoryEntrySourceEntity = AgentMemoryEntrySourceEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_memory_entry_sources' }),
    (0, typeorm_1.Index)(['memoryEntryId', 'observationId', 'evidenceHash'], { unique: true }),
    (0, typeorm_1.Index)(['memoryEntryId', 'candidateId', 'evidenceHash'], {
        unique: true,
        where: '"candidateId" IS NOT NULL',
    }),
    (0, typeorm_1.Index)(['observationId']),
    (0, typeorm_1.Index)(['candidateId']),
    (0, typeorm_1.Index)(['agentId', 'threadId']),
    (0, typeorm_1.Index)(['threadId'])
], AgentMemoryEntrySourceEntity);
//# sourceMappingURL=agent-memory-entry-source.entity.js.map