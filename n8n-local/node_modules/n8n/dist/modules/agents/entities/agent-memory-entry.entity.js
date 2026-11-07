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
exports.AgentMemoryEntryEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentMemoryEntryEntity = class AgentMemoryEntryEntity extends db_1.WithTimestampsAndStringId {
};
exports.AgentMemoryEntryEntity = AgentMemoryEntryEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AgentMemoryEntryEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AgentMemoryEntryEntity.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AgentMemoryEntryEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AgentMemoryEntryEntity.prototype, "contentHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], AgentMemoryEntryEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntryEntity.prototype, "supersededBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntryEntity.prototype, "embeddingModel", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntryEntity.prototype, "embedding", void 0);
__decorate([
    (0, db_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], AgentMemoryEntryEntity.prototype, "metadata", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], AgentMemoryEntryEntity.prototype, "lastSeenAt", void 0);
exports.AgentMemoryEntryEntity = AgentMemoryEntryEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents_memory_entries' }),
    (0, typeorm_1.Index)(['agentId', 'resourceId', 'status', 'createdAt', 'id']),
    (0, typeorm_1.Index)(['agentId', 'resourceId', 'contentHash'], { unique: true }),
    (0, typeorm_1.Index)(['resourceId']),
    (0, typeorm_1.Index)(['supersededBy'])
], AgentMemoryEntryEntity);
//# sourceMappingURL=agent-memory-entry.entity.js.map